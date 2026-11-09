// SPDX-License-Identifier: AGPL-3.0-or-later

use ranger::prelude::*;
use std::cell::RefCell;
use std::rc::Rc;

use crate::rgr::PdfText;
use crate::rgr::{GrowableBuffer};

/// JPEGMetadata.rgr - JPEG Metadata Parser for Ranger
/// Parses EXIF, JFIF, and other metadata from JPEG files
///
/// JPEG APP Markers:
/// FFE0 (APP0) - JFIF with resolution info
/// FFE1 (APP1) - EXIF data (camera, GPS, date, etc.)
/// FFE2 (APP2) - ICC color profile
/// FFED (APP13) - IPTC/Photoshop
/// FFFE - Comment
#[derive(Clone)]
pub struct ExifTag {
    pub tagId: i64,
    pub tagName: String,
    pub tagValue: String,
    pub dataType: i64,
}

impl ExifTag {
    pub fn new() -> Self {
        Self {
            tagId: 0,
            tagName: String::new(),
            tagValue: String::new(),
            dataType: 0,
        }
    }
}

#[derive(Clone)]
pub struct JPEGMetadataInfo {
    pub isValid: bool,
    pub errorMessage: String,
    /// JFIF info
    pub hasJFIF: bool,
    pub jfifVersion: String,
    /// 0=no units, 1=pixels/inch, 2=pixels/cm
    pub densityUnits: i64,
    pub xDensity: i64,
    pub yDensity: i64,
    /// Basic image info
    pub width: i64,
    pub height: i64,
    pub colorComponents: i64,
    pub bitsPerComponent: i64,
    /// EXIF info
    pub hasExif: bool,
    pub cameraMake: String,
    pub cameraModel: String,
    pub software: String,
    pub dateTime: String,
    pub dateTimeOriginal: String,
    pub exposureTime: String,
    pub fNumber: String,
    pub isoSpeed: String,
    pub focalLength: String,
    pub flash: String,
    pub orientation: i64,
    pub xResolution: String,
    pub yResolution: String,
    pub resolutionUnit: i64,
    /// GPS info
    pub hasGPS: bool,
    pub gpsLatitude: String,
    pub gpsLongitude: String,
    pub gpsAltitude: String,
    /// N or S
    pub gpsLatitudeRef: String,
    /// E or W
    pub gpsLongitudeRef: String,
    /// The same position as a number, signed by the ref: south and west are
    /// negative. `gpsLatitude` is a string for a person to read - degrees,
    /// minutes and seconds with the direction kept separately - and nothing can
    /// compute a distance from it. Anything that searches by place needs these.
    pub gpsLatitudeDeg: f64,
    pub gpsLongitudeDeg: f64,
    /// Comment
    pub hasComment: bool,
    pub comment: String,
    /// Raw tags for debugging
    pub exifTags: Vec<Rc<RefCell<ExifTag>>>,
}

impl JPEGMetadataInfo {
    pub fn new() -> Self {
        Self {
            isValid: false,
            errorMessage: String::new(),
            hasJFIF: false,
            jfifVersion: String::new(),
            densityUnits: 0,
            xDensity: 0,
            yDensity: 0,
            width: 0,
            height: 0,
            colorComponents: 0,
            bitsPerComponent: 0,
            hasExif: false,
            cameraMake: String::new(),
            cameraModel: String::new(),
            software: String::new(),
            dateTime: String::new(),
            dateTimeOriginal: String::new(),
            exposureTime: String::new(),
            fNumber: String::new(),
            isoSpeed: String::new(),
            focalLength: String::new(),
            flash: String::new(),
            orientation: 1,
            xResolution: String::new(),
            yResolution: String::new(),
            resolutionUnit: 0,
            hasGPS: false,
            gpsLatitude: String::new(),
            gpsLongitude: String::new(),
            gpsAltitude: String::new(),
            gpsLatitudeRef: String::new(),
            gpsLongitudeRef: String::new(),
            gpsLatitudeDeg: 0.0,
            gpsLongitudeDeg: 0.0,
            hasComment: false,
            comment: String::new(),
            exifTags: Vec::new(),
        }
    }
}

#[derive(Clone)]
pub struct JPEGMetadataParser {
    pub data: Vec<u8>,
    pub dataLen: i64,
    /// EXIF byte order
    pub littleEndian: bool,
}

impl JPEGMetadataParser {
    pub fn new() -> Self {
        Self {
            data: vec![0u8; 0],
            dataLen: 0,
            littleEndian: false,
        }
    }
    pub fn read_uint16be(&self, offset: i64) -> i64 {
        let high: i64 = self.data[offset as usize] as i64;
        let low: i64 = self.data[(offset + 1) as usize] as i64;
        high * 256 + low
    }
    pub fn readUint16(&self, offset: i64) -> i64 {
        // Read with current endianness (for EXIF)
        let mut result: i64 = 0;
        if self.littleEndian {
            let low: i64 = self.data[offset as usize] as i64;
            let high: i64 = self.data[(offset + 1) as usize] as i64;
            result = high * 256 + low;
        } else {
            let high_1: i64 = self.data[offset as usize] as i64;
            let low_1: i64 = self.data[(offset + 1) as usize] as i64;
            result = high_1 * 256 + low_1;
        }
        result
    }
    pub fn readUint32(&self, offset: i64) -> i64 {
        // Read 32-bit with current endianness
        let mut result: i64 = 0;
        if self.littleEndian {
            let b0: i64 = self.data[offset as usize] as i64;
            let b1: i64 = self.data[(offset + 1) as usize] as i64;
            let b2: i64 = self.data[(offset + 2) as usize] as i64;
            let b3: i64 = self.data[(offset + 3) as usize] as i64;
            result = ((b3 * 16777216 + b2 * 65536) + b1 * 256) + b0;
        } else {
            let b0_1: i64 = self.data[offset as usize] as i64;
            let b1_1: i64 = self.data[(offset + 1) as usize] as i64;
            let b2_1: i64 = self.data[(offset + 2) as usize] as i64;
            let b3_1: i64 = self.data[(offset + 3) as usize] as i64;
            result = ((b0_1 * 16777216 + b1_1 * 65536) + b2_1 * 256) + b3_1;
        }
        result
    }
    pub fn readString(&self, offset: i64, length: i64) -> String {
        let mut result: String = String::new();
        let mut i: i64 = 0;
        while i < length {
            let b: i64 = self.data[(offset + i) as usize] as i64;
            if b == 0 {
                // Null terminator
                return result;
            }
            result.push_str(&char::from_u32(b as u32).unwrap_or('\0').to_string());
            i += 1;
        }
        result
    }
    pub fn getTagName(&self, tag_id: i64, ifd_type: i64) -> String {
        // IFD types: 0=IFD0, 1=EXIF, 2=GPS
        if ifd_type == 2 {
            // GPS tags
            if tag_id == 0 {
                return "GPSVersionID".to_string();
            }
            if tag_id == 1 {
                return "GPSLatitudeRef".to_string();
            }
            if tag_id == 2 {
                return "GPSLatitude".to_string();
            }
            if tag_id == 3 {
                return "GPSLongitudeRef".to_string();
            }
            if tag_id == 4 {
                return "GPSLongitude".to_string();
            }
            if tag_id == 5 {
                return "GPSAltitudeRef".to_string();
            }
            if tag_id == 6 {
                return "GPSAltitude".to_string();
            }
            return format!("GPS_{}", tag_id);
        }
        // Common EXIF tags
        if tag_id == 256 {
            return "ImageWidth".to_string();
        }
        if tag_id == 257 {
            return "ImageHeight".to_string();
        }
        if tag_id == 258 {
            return "BitsPerSample".to_string();
        }
        if tag_id == 259 {
            return "Compression".to_string();
        }
        if tag_id == 262 {
            return "PhotometricInterpretation".to_string();
        }
        if tag_id == 270 {
            return "ImageDescription".to_string();
        }
        if tag_id == 271 {
            return "Make".to_string();
        }
        if tag_id == 272 {
            return "Model".to_string();
        }
        if tag_id == 274 {
            return "Orientation".to_string();
        }
        if tag_id == 282 {
            return "XResolution".to_string();
        }
        if tag_id == 283 {
            return "YResolution".to_string();
        }
        if tag_id == 296 {
            return "ResolutionUnit".to_string();
        }
        if tag_id == 305 {
            return "Software".to_string();
        }
        if tag_id == 306 {
            return "DateTime".to_string();
        }
        if tag_id == 315 {
            return "Artist".to_string();
        }
        if tag_id == 33432 {
            return "Copyright".to_string();
        }
        if tag_id == 33434 {
            return "ExposureTime".to_string();
        }
        if tag_id == 33437 {
            return "FNumber".to_string();
        }
        if tag_id == 34850 {
            return "ExposureProgram".to_string();
        }
        if tag_id == 34855 {
            return "ISOSpeedRatings".to_string();
        }
        if tag_id == 36864 {
            return "ExifVersion".to_string();
        }
        if tag_id == 36867 {
            return "DateTimeOriginal".to_string();
        }
        if tag_id == 36868 {
            return "DateTimeDigitized".to_string();
        }
        if tag_id == 37377 {
            return "ShutterSpeedValue".to_string();
        }
        if tag_id == 37378 {
            return "ApertureValue".to_string();
        }
        if tag_id == 37380 {
            return "ExposureBiasValue".to_string();
        }
        if tag_id == 37381 {
            return "MaxApertureValue".to_string();
        }
        if tag_id == 37383 {
            return "MeteringMode".to_string();
        }
        if tag_id == 37384 {
            return "LightSource".to_string();
        }
        if tag_id == 37385 {
            return "Flash".to_string();
        }
        if tag_id == 37386 {
            return "FocalLength".to_string();
        }
        if tag_id == 37500 {
            return "MakerNote".to_string();
        }
        if tag_id == 37510 {
            return "UserComment".to_string();
        }
        if tag_id == 40960 {
            return "FlashpixVersion".to_string();
        }
        if tag_id == 40961 {
            return "ColorSpace".to_string();
        }
        if tag_id == 40962 {
            return "PixelXDimension".to_string();
        }
        if tag_id == 40963 {
            return "PixelYDimension".to_string();
        }
        if tag_id == 41486 {
            return "FocalPlaneXResolution".to_string();
        }
        if tag_id == 41487 {
            return "FocalPlaneYResolution".to_string();
        }
        if tag_id == 41488 {
            return "FocalPlaneResolutionUnit".to_string();
        }
        if tag_id == 41495 {
            return "SensingMethod".to_string();
        }
        if tag_id == 41728 {
            return "FileSource".to_string();
        }
        if tag_id == 41729 {
            return "SceneType".to_string();
        }
        if tag_id == 41985 {
            return "CustomRendered".to_string();
        }
        if tag_id == 41986 {
            return "ExposureMode".to_string();
        }
        if tag_id == 41987 {
            return "WhiteBalance".to_string();
        }
        if tag_id == 41988 {
            return "DigitalZoomRatio".to_string();
        }
        if tag_id == 41989 {
            return "FocalLengthIn35mmFilm".to_string();
        }
        if tag_id == 41990 {
            return "SceneCaptureType".to_string();
        }
        if tag_id == 34665 {
            return "ExifIFDPointer".to_string();
        }
        if tag_id == 34853 {
            return "GPSInfoIFDPointer".to_string();
        }
        format!("Tag_{}", tag_id)
    }
    pub fn formatRational(&self, offset: i64) -> String {
        let numerator: i64 = self.readUint32(offset);
        let denominator: i64 = self.readUint32(offset + 4);
        if denominator == 0 {
            return numerator.to_string();
        }
        if denominator == 1 {
            return numerator.to_string();
        }
        format!("{}/{}", numerator.to_string(), denominator)
    }
    pub fn formatGPSCoordinate(&self, offset: i64, r#ref: &str) -> String {
        // GPS coordinates are stored as 3 RATIONALs: degrees, minutes, seconds
        // Each RATIONAL is 8 bytes (numerator + denominator)
        let deg_num: i64 = self.readUint32(offset);
        let deg_den: i64 = self.readUint32(offset + 4);
        let min_num: i64 = self.readUint32(offset + 8);
        let min_den: i64 = self.readUint32(offset + 12);
        let sec_num: i64 = self.readUint32(offset + 16);
        let sec_den: i64 = self.readUint32(offset + 20);
        // Calculate degrees (integer division using repeated subtraction approach)
        let mut degrees: i64 = 0;
        if deg_den > 0 {
            let mut temp_deg: i64 = deg_num;
            while temp_deg >= deg_den {
                temp_deg -= deg_den;
                degrees += 1;
            }
        }
        // Calculate minutes
        let mut minutes: i64 = 0;
        if min_den > 0 {
            let mut temp_min: i64 = min_num;
            while temp_min >= min_den {
                temp_min -= min_den;
                minutes += 1;
            }
        }
        // Calculate seconds (as decimal string)
        let mut seconds: String = "0".to_string();
        if sec_den > 0 {
            let mut sec_whole: i64 = 0;
            let mut temp_sec: i64 = sec_num;
            while temp_sec >= sec_den {
                temp_sec -= sec_den;
                sec_whole += 1;
            }
            let sec_rem: i64 = temp_sec;
            if sec_rem > 0 {
                // Calculate decimal part (2 decimal places)
                let mut dec_part_temp: i64 = sec_rem * 100;
                let mut dec_part: i64 = 0;
                while dec_part_temp >= sec_den {
                    dec_part_temp -= sec_den;
                    dec_part += 1;
                }
                if dec_part < 10 {
                    seconds = format!("{}.0{}", sec_whole.to_string(), dec_part);
                } else {
                    seconds = format!("{}.{}", sec_whole.to_string(), dec_part);
                }
            } else {
                seconds = sec_whole.to_string();
            }
        }
        // Return coordinate without the direction - direction is stored separately in gpsLatitudeRef/gpsLongitudeRef
        format!("{}° {}' {}\"", degrees.to_string(), minutes, seconds)
    }
    /// Degrees, minutes and seconds as one signed number.
    ///
    /// Computed in doubles from the rationals rather than from the string above,
    /// for two reasons. Phones do not agree on how they split a position: some
    /// write 60 degrees 10 minutes 11.6 seconds, others write 60.169900 degrees
    /// with minutes and seconds at zero, and the integer path drops the fraction
    /// of the first field. And a coordinate rounded to two decimal places of a
    /// second is fine to look at and not fine to search a radius with.
    pub fn decimalGPS(&self, offset: i64, r#ref: &str) -> f64 {
        let deg_num: i64 = self.readUint32(offset);
        let deg_den: i64 = self.readUint32(offset + 4);
        let min_num: i64 = self.readUint32(offset + 8);
        let min_den: i64 = self.readUint32(offset + 12);
        let sec_num: i64 = self.readUint32(offset + 16);
        let sec_den: i64 = self.readUint32(offset + 20);
        let mut total: f64 = 0.0;
        if deg_den > 0 {
            let d: f64 = (deg_num as f64) / (deg_den as f64);
            total += d;
        }
        if min_den > 0 {
            let m: f64 = (min_num as f64) / (min_den as f64);
            total += m / 60.0;
        }
        if sec_den > 0 {
            let sec: f64 = (sec_num as f64) / (sec_den as f64);
            total += sec / 3600.0;
        }
        // South and west are the same angle in the other direction.
        if r#ref == "S" {
            return 0.0 - total;
        }
        if r#ref == "W" {
            return 0.0 - total;
        }
        total
    }
    pub fn parseIFD(&self, info: &Rc<RefCell<JPEGMetadataInfo>>, tiff_start: i64, ifd_offset: i64, ifd_type: i64) {
        let mut pos: i64 = tiff_start + ifd_offset;
        if pos + 2 > self.dataLen {
            return;
        }
        let num_entries: i64 = self.readUint16(pos);
        pos += 2;
        let mut i: i64 = 0;
        while i < num_entries {
            if pos + 12 > self.dataLen {
                return;
            }
            let tag_id: i64 = self.readUint16(pos);
            let data_type: i64 = self.readUint16(pos + 2);
            let num_values: i64 = self.readUint32(pos + 4);
            let mut value_offset: i64 = pos + 8;
            // Calculate data size
            let mut data_size: i64 = 0;
            // BYTE
            if data_type == 1 {
                data_size = num_values;
            }
            // ASCII
            if data_type == 2 {
                data_size = num_values;
            }
            // SHORT
            if data_type == 3 {
                data_size = num_values * 2;
            }
            // LONG
            if data_type == 4 {
                data_size = num_values * 4;
            }
            // RATIONAL
            if data_type == 5 {
                data_size = num_values * 8;
            }
            // UNDEFINED
            if data_type == 7 {
                data_size = num_values;
            }
            // SLONG
            if data_type == 9 {
                data_size = num_values * 4;
            }
            // SRATIONAL
            if data_type == 10 {
                data_size = num_values * 8;
            }
            // If data > 4 bytes, valueOffset contains pointer to actual data
            if data_size > 4 {
                value_offset = tiff_start + self.readUint32(pos + 8);
            }
            let tag_name: String = self.getTagName(tag_id, ifd_type);
            let mut tag_value: String = String::new();
            // Parse value based on type
            if data_type == 2 {
                // ASCII string
                tag_value = self.readString(value_offset, num_values);
            }
            if data_type == 3 {
                // SHORT
                if data_size <= 4 {
                    tag_value = self.readUint16(pos + 8).to_string();
                } else {
                    tag_value = self.readUint16(value_offset).to_string();
                }
            }
            if data_type == 4 {
                // LONG
                if data_size <= 4 {
                    tag_value = self.readUint32(pos + 8).to_string();
                } else {
                    tag_value = self.readUint32(value_offset).to_string();
                }
            }
            if data_type == 5 {
                // RATIONAL
                tag_value = self.formatRational(value_offset);
            }
            // Store in ExifTag
            let mut tag: Rc<RefCell<ExifTag>> = Rc::new(RefCell::new(ExifTag::new()));
            tag.borrow_mut().tagId = tag_id;
            tag.borrow_mut().tagName = tag_name.clone();
            tag.borrow_mut().tagValue = tag_value.clone();
            tag.borrow_mut().dataType = data_type;
            info.borrow_mut().exifTags.push(tag.clone());
            // Extract specific fields
            if tag_id == 271 {
                info.borrow_mut().cameraMake = tag_value.clone();
            }
            if tag_id == 272 {
                info.borrow_mut().cameraModel = tag_value.clone();
            }
            if tag_id == 305 {
                info.borrow_mut().software = tag_value.clone();
            }
            if tag_id == 306 {
                info.borrow_mut().dateTime = tag_value.clone();
            }
            if tag_id == 274 {
                info.borrow_mut().orientation = self.readUint16(pos + 8);
            }
            if tag_id == 282 {
                info.borrow_mut().xResolution = tag_value.clone();
            }
            if tag_id == 283 {
                info.borrow_mut().yResolution = tag_value.clone();
            }
            if tag_id == 296 {
                info.borrow_mut().resolutionUnit = self.readUint16(pos + 8);
            }
            if tag_id == 36867 {
                info.borrow_mut().dateTimeOriginal = tag_value.clone();
            }
            if tag_id == 33434 {
                info.borrow_mut().exposureTime = tag_value.clone();
            }
            if tag_id == 33437 {
                info.borrow_mut().fNumber = tag_value.clone();
            }
            if tag_id == 34855 {
                info.borrow_mut().isoSpeed = tag_value.clone();
            }
            if tag_id == 37386 {
                info.borrow_mut().focalLength = tag_value.clone();
            }
            if tag_id == 37385 {
                let flash_val: i64 = self.readUint16(pos + 8);
                if flash_val % 2 == 1 {
                    info.borrow_mut().flash = "Fired".to_string();
                } else {
                    info.borrow_mut().flash = "Did not fire".to_string();
                }
            }
            // Check for sub-IFDs
            if tag_id == 34665 {
                // EXIF IFD pointer
                let exif_offset: i64 = self.readUint32(pos + 8);
                self.parseIFD(info, tiff_start, exif_offset, 1);
            }
            if tag_id == 34853 {
                // GPS IFD pointer
                info.borrow_mut().hasGPS = true;
                let gps_offset: i64 = self.readUint32(pos + 8);
                self.parseIFD(info, tiff_start, gps_offset, 2);
            }
            // GPS specific fields (ifdType 2 = GPS IFD)
            if ifd_type == 2 {
                // GPS LatitudeRef (N or S)
                if tag_id == 1 {
                    info.borrow_mut().gpsLatitudeRef = tag_value.clone();
                }
                // GPS Latitude (3 RATIONALs)
                if tag_id == 2 {
                    let _tmp_6 = self.formatGPSCoordinate(value_offset, &info.borrow().gpsLatitudeRef.clone());
                    info.borrow_mut().gpsLatitude = _tmp_6;
                    let _tmp_8 = self.decimalGPS(value_offset, &info.borrow().gpsLatitudeRef.clone());
                    info.borrow_mut().gpsLatitudeDeg = _tmp_8;
                }
                // GPS LongitudeRef (E or W)
                if tag_id == 3 {
                    info.borrow_mut().gpsLongitudeRef = tag_value.clone();
                }
                // GPS Longitude (3 RATIONALs)
                if tag_id == 4 {
                    let _tmp_10 = self.formatGPSCoordinate(value_offset, &info.borrow().gpsLongitudeRef.clone());
                    info.borrow_mut().gpsLongitude = _tmp_10;
                    let _tmp_12 = self.decimalGPS(value_offset, &info.borrow().gpsLongitudeRef.clone());
                    info.borrow_mut().gpsLongitudeDeg = _tmp_12;
                }
                // GPS Altitude
                if tag_id == 6 {
                    let alt_num: i64 = self.readUint32(value_offset);
                    let alt_den: i64 = self.readUint32(value_offset + 4);
                    if alt_den > 0 {
                        let mut alt_whole: i64 = 0;
                        let mut temp_alt: i64 = alt_num;
                        while temp_alt >= alt_den {
                            temp_alt -= alt_den;
                            alt_whole += 1;
                        }
                        let alt_rem: i64 = temp_alt;
                        if alt_rem > 0 {
                            let mut alt_dec_temp: i64 = alt_rem * 10;
                            let mut alt_dec: i64 = 0;
                            while alt_dec_temp >= alt_den {
                                alt_dec_temp -= alt_den;
                                alt_dec += 1;
                            }
                            info.borrow_mut().gpsAltitude = format!("{}.{} m", alt_whole.to_string(), alt_dec);
                        } else {
                            info.borrow_mut().gpsAltitude = format!("{} m", alt_whole.to_string());
                        }
                    } else {
                        info.borrow_mut().gpsAltitude = format!("{} m", alt_num.to_string());
                    }
                }
            }
            pos += 12;
            i += 1;
        }
    }
    pub fn parseExif(&mut self, info: &Rc<RefCell<JPEGMetadataInfo>>, app_start: i64, app_len: i64) {
        // Check for "Exif\0\0" header
        let header: String = self.readString(app_start, 4);
        if header != "Exif" {
            return;
        }
        info.borrow_mut().hasExif = true;
        // TIFF header starts at appStart + 6
        let tiff_start: i64 = app_start + 6;
        // Read byte order
        let byte_order0: i64 = self.data[tiff_start as usize] as i64;
        let byte_order1: i64 = self.data[(tiff_start + 1) as usize] as i64;
        if byte_order0 == 73 && byte_order1 == 73 {
            // "II" = Intel = little endian
            self.littleEndian = true;
        } else {
            if byte_order0 == 77 && byte_order1 == 77 {
                // "MM" = Motorola = big endian
                self.littleEndian = false;
            } else {
                return;
            }
        }
        // Verify TIFF magic number (42)
        let magic: i64 = self.readUint16(tiff_start + 2);
        if magic != 42 {
            return;
        }
        // Get IFD0 offset
        let ifd0_offset: i64 = self.readUint32(tiff_start + 4);
        // Parse IFD0
        self.parseIFD(info, tiff_start, ifd0_offset, 0);
    }
    pub fn parseJFIF(&self, info: &Rc<RefCell<JPEGMetadataInfo>>, app_start: i64, app_len: i64) {
        let header: String = self.readString(app_start, 4);
        if header != "JFIF" {
            return;
        }
        info.borrow_mut().hasJFIF = true;
        // Version
        let ver_major: i64 = self.data[(app_start + 5) as usize] as i64;
        let ver_minor: i64 = self.data[(app_start + 6) as usize] as i64;
        info.borrow_mut().jfifVersion = format!("{}.{}", ver_major.to_string(), ver_minor);
        // Density units
        info.borrow_mut().densityUnits = self.data[(app_start + 7) as usize] as i64;
        // X and Y density
        info.borrow_mut().xDensity = self.read_uint16be(app_start + 8);
        info.borrow_mut().yDensity = self.read_uint16be(app_start + 10);
    }
    pub fn parseComment(&self, info: &Rc<RefCell<JPEGMetadataInfo>>, app_start: i64, app_len: i64) {
        info.borrow_mut().hasComment = true;
        info.borrow_mut().comment = self.readString(app_start, app_len);
    }
    pub fn parseMetadata(&mut self, dir_path: &str, file_name: &str) -> Rc<RefCell<JPEGMetadataInfo>> {
        self.data = PdfText::read_file(dir_path.clone(), file_name.clone());
        self.parseLoaded()
    }
    /// The same, for bytes somebody already has. A browser cannot open a file by
    /// name - it is handed one - and reading a photograph's EXIF in the page is
    /// the only way an in-page search by date or place can work at all. Keeping
    /// the marker walk in one place means the two paths cannot drift.
    pub fn parseBuffer(&mut self, bytes: Vec<u8>) -> Rc<RefCell<JPEGMetadataInfo>> {
        self.data = bytes.clone();
        self.parseLoaded()
    }
    pub fn parseLoaded(&mut self) -> Rc<RefCell<JPEGMetadataInfo>> {
        let mut info: Rc<RefCell<JPEGMetadataInfo>> = Rc::new(RefCell::new(JPEGMetadataInfo::new()));
        self.dataLen = self.data.len() as i64;
        if self.dataLen < 4 {
            info.borrow_mut().errorMessage = "File too small".to_string();
            return info;
        }
        // Check JPEG signature
        let m1: i64 = self.data[0] as i64;
        let m2: i64 = self.data[1] as i64;
        if m1 != 255 || m2 != 216 {
            info.borrow_mut().errorMessage = "Not a valid JPEG file".to_string();
            return info;
        }
        info.borrow_mut().isValid = true;
        // Parse markers
        let mut pos: i64 = 2;
        while pos < self.dataLen {
            let marker1: i64 = self.data[pos as usize] as i64;
            if marker1 != 255 {
                pos += 1;
                continue;
            }
            let marker2: i64 = self.data[(pos + 1) as usize] as i64;
            // Skip padding 0xFF bytes
            if marker2 == 255 {
                pos += 1;
                continue;
            }
            // SOI, EOI, RST markers have no length
            if marker2 == 216 || marker2 == 217 {
                pos += 2;
                continue;
            }
            if (marker2 >= 208 && marker2 <= 215) {
                pos += 2;
                continue;
            }
            // Read segment length
            if pos + 4 > self.dataLen {
                return info;
            }
            let seg_len: i64 = self.read_uint16be(pos + 2);
            let seg_start: i64 = pos + 4;
            // APP0 (JFIF)
            if marker2 == 224 {
                self.parseJFIF(&info, seg_start, seg_len - 2);
            }
            // APP1 (EXIF)
            if marker2 == 225 {
                self.parseExif(&info, seg_start, seg_len - 2);
            }
            // Comment (FFFE)
            if marker2 == 254 {
                self.parseComment(&info, seg_start, seg_len - 2);
            }
            // SOF0/SOF2 - Start of Frame (image dimensions)
            if marker2 == 192 || marker2 == 194 {
                if pos + 9 < self.dataLen {
                    info.borrow_mut().bitsPerComponent = self.data[(pos + 4) as usize] as i64;
                    info.borrow_mut().height = self.read_uint16be(pos + 5);
                    info.borrow_mut().width = self.read_uint16be(pos + 7);
                    info.borrow_mut().colorComponents = self.data[(pos + 9) as usize] as i64;
                }
            }
            // SOS - Start of Scan, image data follows
            if marker2 == 218 {
                return info;
            }
            // EOI - End of Image
            if marker2 == 217 {
                return info;
            }
            pos = (pos + 2) + seg_len;
        }
        info
    }
    pub fn formatMetadata(&self, info: &Rc<RefCell<JPEGMetadataInfo>>) -> String {
        let mut out: Rc<RefCell<GrowableBuffer>> = Rc::new(RefCell::new(GrowableBuffer::new()));
        GrowableBuffer::writeString(&out, "=== JPEG Metadata ===\n\n");
        if !info.borrow().isValid {
            GrowableBuffer::writeString(&out, &format!("Error: {}\n", info.borrow().errorMessage));
            return GrowableBuffer::toString(&out);
        }
        // Basic info
        GrowableBuffer::writeString(&out, "--- Image Info ---\n");
        GrowableBuffer::writeString(&out, &format!("  Dimensions: {} x {}\n", info.borrow().width, info.borrow().height));
        GrowableBuffer::writeString(&out, &format!("  Color Components: {}\n", info.borrow().colorComponents));
        GrowableBuffer::writeString(&out, &format!("  Bits per Component: {}\n", info.borrow().bitsPerComponent));
        // JFIF info
        if info.borrow().hasJFIF {
            GrowableBuffer::writeString(&out, "\n--- JFIF Info ---\n");
            GrowableBuffer::writeString(&out, &format!("  Version: {}\n", info.borrow().jfifVersion));
            let mut density_str: String = "No units (aspect ratio)";
            if info.borrow().densityUnits == 1 {
                density_str = "pixels/inch";
            }
            if info.borrow().densityUnits == 2 {
                density_str = "pixels/cm";
            }
            GrowableBuffer::writeString(&out, &format!("  Density: {} x {} {}\n", info.borrow().xDensity, info.borrow().yDensity, density_str));
        }
        // EXIF info
        if info.borrow().hasExif {
            GrowableBuffer::writeString(&out, "\n--- EXIF Info ---\n");
            if !info.borrow().cameraMake.is_empty() {
                GrowableBuffer::writeString(&out, &format!("  Camera Make: {}\n", info.borrow().cameraMake));
            }
            if !info.borrow().cameraModel.is_empty() {
                GrowableBuffer::writeString(&out, &format!("  Camera Model: {}\n", info.borrow().cameraModel));
            }
            if !info.borrow().software.is_empty() {
                GrowableBuffer::writeString(&out, &format!("  Software: {}\n", info.borrow().software));
            }
            if !info.borrow().dateTimeOriginal.is_empty() {
                GrowableBuffer::writeString(&out, &format!("  Date/Time Original: {}\n", info.borrow().dateTimeOriginal));
            } else {
                if !info.borrow().dateTime.is_empty() {
                    GrowableBuffer::writeString(&out, &format!("  Date/Time: {}\n", info.borrow().dateTime));
                }
            }
            if !info.borrow().exposureTime.is_empty() {
                GrowableBuffer::writeString(&out, &format!("  Exposure Time: {} sec\n", info.borrow().exposureTime));
            }
            if !info.borrow().fNumber.is_empty() {
                GrowableBuffer::writeString(&out, &format!("  F-Number: f/{}\n", info.borrow().fNumber));
            }
            if !info.borrow().isoSpeed.is_empty() {
                GrowableBuffer::writeString(&out, &format!("  ISO Speed: {}\n", info.borrow().isoSpeed));
            }
            if !info.borrow().focalLength.is_empty() {
                GrowableBuffer::writeString(&out, &format!("  Focal Length: {} mm\n", info.borrow().focalLength));
            }
            if !info.borrow().flash.is_empty() {
                GrowableBuffer::writeString(&out, &format!("  Flash: {}\n", info.borrow().flash));
            }
            let mut orient_str: String = "Normal";
            if info.borrow().orientation == 2 {
                orient_str = "Flip horizontal";
            }
            if info.borrow().orientation == 3 {
                orient_str = "Rotate 180";
            }
            if info.borrow().orientation == 4 {
                orient_str = "Flip vertical";
            }
            if info.borrow().orientation == 5 {
                orient_str = "Transpose";
            }
            if info.borrow().orientation == 6 {
                orient_str = "Rotate 90 CW";
            }
            if info.borrow().orientation == 7 {
                orient_str = "Transverse";
            }
            if info.borrow().orientation == 8 {
                orient_str = "Rotate 270 CW";
            }
            GrowableBuffer::writeString(&out, &format!("  Orientation: {}\n", orient_str));
        }
        // GPS info
        if info.borrow().hasGPS {
            GrowableBuffer::writeString(&out, "\n--- GPS Info ---\n");
            if !info.borrow().gpsLatitude.is_empty() {
                GrowableBuffer::writeString(&out, &format!("  Latitude: {}\n", info.borrow().gpsLatitude));
            }
            if !info.borrow().gpsLongitude.is_empty() {
                GrowableBuffer::writeString(&out, &format!("  Longitude: {}\n", info.borrow().gpsLongitude));
            }
            if !info.borrow().gpsAltitude.is_empty() {
                GrowableBuffer::writeString(&out, &format!("  Altitude: {}\n", info.borrow().gpsAltitude));
            }
        }
        // Comment
        if info.borrow().hasComment {
            GrowableBuffer::writeString(&out, "\n--- Comment ---\n");
            GrowableBuffer::writeString(&out, &format!("  {}\n", info.borrow().comment));
        }
        // Raw tags
        let tag_count: i64 = info.borrow().exifTags.len() as i64;
        if tag_count > 0 {
            GrowableBuffer::writeString(&out, &format!("\n--- All EXIF Tags ({}) ---\n", tag_count));
            let __it_tag = info.borrow().exifTags.clone();
            for tag in __it_tag.iter().cloned() {
                GrowableBuffer::writeString(&out, &format!("  {} (0x", tag.borrow().tagName));
                // Simple hex conversion for tag ID
                let mut tag_hex: String = String::new();
                let tid: i64 = tag.borrow().tagId;
                let hex_chars: String = "0123456789ABCDEF";
                let h3d: f64 = tid as f64 / 4096.0;
                let h3: i64 = h3d.floor() as i64;
                let r3: i64 = tid - h3 * 4096;
                let h2d: f64 = r3 as f64 / 256.0;
                let h2: i64 = h2d.floor() as i64;
                let r2: i64 = r3 - h2 * 256;
                let h1d: f64 = r2 as f64 / 16.0;
                let h1: i64 = h1d.floor() as i64;
                let h0: i64 = r2 - h1 * 16;
                tag_hex = format!("{}{}{}{}", PdfText::substr(&hex_chars, h3, h3 + 1), PdfText::substr(&hex_chars, h2, h2 + 1), PdfText::substr(&hex_chars, h1, h1 + 1), PdfText::substr(&hex_chars, h0, h0 + 1));
                GrowableBuffer::writeString(&out, &format!("{}): {}\n", tag_hex, tag.borrow().tagValue));
            }
        }
        return GrowableBuffer::toString(&out);
    }
}

#[derive(Clone)]
pub struct JPEGMetadataMain {
}

impl JPEGMetadataMain {
    pub fn new() -> Self {
        Self {
        }
    }
}
