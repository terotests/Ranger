#!/usr/bin/env node
class BufferChunk  {
  constructor(size) {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.used = 0;
    this.capacity = 0;
    this.data = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    this.capacity = size;
    this.used = 0;
  }
  remaining () {
    return this.capacity - this.used;
  };
  isFull () {
    return this.used >= this.capacity;
  };
}
class GrowableBuffer  {
  constructor() {
    this.chunkSize = 4096;
    this.totalSize = 0;
    const chunk = new BufferChunk(this.chunkSize);
    this.firstChunk = chunk;
    this.currentChunk = chunk;
  }
  setChunkSize (size) {
    this.chunkSize = size;
  };
  allocateNewChunk () {
    const newChunk = new BufferChunk(this.chunkSize);
    this.currentChunk.next = newChunk;
    this.currentChunk = newChunk;
  };
  writeByte (b) {
    if ( this.currentChunk.isFull() ) {
      this.allocateNewChunk();
    }
    const buf = this.currentChunk.data;
    const pos = this.currentChunk.used;
    buf._view.setUint8(pos, b);
    this.currentChunk.used = pos + 1;
    this.totalSize = this.totalSize + 1;
  };
  writeBytes (src, srcOffset, length) {
    let i = 0;
    while (i < length) {
      const b = src._view.getUint8((srcOffset + i));
      this.writeByte(b);
      i = i + 1;
    };
  };
  writeBuffer (src) {
    const __len = src.byteLength;
    this.writeBytes(src, 0, __len);
  };
  writeString (s) {
    const __len = s.length;
    let i = 0;
    while (i < __len) {
      const ch = s.charCodeAt(i );
      this.writeByte(ch);
      i = i + 1;
    };
  };
  writeInt16BE (value) {
    const highD = value / 256;
    const high = Math.floor( highD);
    const low = value - (high * 256);
    this.writeByte(high);
    this.writeByte(low);
  };
  writeInt32BE (value) {
    const b1D = value / 16777216;
    const b1 = Math.floor( b1D);
    const rem1 = value - (b1 * 16777216);
    const b2D = rem1 / 65536;
    const b2 = Math.floor( b2D);
    const rem2 = rem1 - (b2 * 65536);
    const b3D = rem2 / 256;
    const b3 = Math.floor( b3D);
    const b4 = rem2 - (b3 * 256);
    this.writeByte(b1);
    this.writeByte(b2);
    this.writeByte(b3);
    this.writeByte(b4);
  };
  size () {
    return this.totalSize;
  };
  toBuffer () {
    const allocSize = this.totalSize;
    const result = (function(){ var b = new ArrayBuffer(allocSize); b._view = new DataView(b); return b; })();
    let pos = 0;
    let chunk = this.firstChunk;
    let done = false;
    while (done == false) {
      const chunkData = chunk.data;
      const chunkUsed = chunk.used;
      let i = 0;
      while (i < chunkUsed) {
        const b = chunkData._view.getUint8(i);
        result._view.setUint8(pos, b);
        pos = pos + 1;
        i = i + 1;
      };
      if ( typeof(chunk.next) === "undefined" ) {
        done = true;
      } else {
        chunk = chunk.next;
      }
    };
    return result;
  };
  toString () {
    let result = "";
    let chunk = this.firstChunk;
    let done = false;
    while (done == false) {
      const chunkData = chunk.data;
      const chunkUsed = chunk.used;
      let i = 0;
      while (i < chunkUsed) {
        const b = chunkData._view.getUint8(i);
        result = result + (String.fromCharCode(b));
        i = i + 1;
      };
      if ( typeof(chunk.next) === "undefined" ) {
        done = true;
      } else {
        chunk = chunk.next;
      }
    };
    return result;
  };
  clear () {
    const chunk = new BufferChunk(this.chunkSize);
    this.firstChunk = chunk;
    this.currentChunk = chunk;
    this.totalSize = 0;
  };
}
class JPEGImage  {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.colorComponents = 3;
    this.bitsPerComponent = 8;
    this.isValid = false;
    this.errorMessage = "";
  }
}
class JPEGReader  {
  constructor() {
  }
  readUint16BE (data, offset) {
    const high = data._view.getUint8(offset);
    const low = data._view.getUint8((offset + 1));
    return (high * 256) + low;
  };
  readJPEG (dirPath, fileName) {
    const result = new JPEGImage();
    const data = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    const dataLen = data.byteLength;
    if ( dataLen < 4 ) {
      result.errorMessage = "File too small to be a valid JPEG";
      return result;
    }
    const marker1 = data._view.getUint8(0);
    const marker2 = data._view.getUint8(1);
    if ( (marker1 != 255) || (marker2 != 216) ) {
      result.errorMessage = "Invalid JPEG signature - expected FFD8";
      return result;
    }
    let pos = 2;
    let foundSOF = false;
    while ((pos < (dataLen - 2)) && (foundSOF == false)) {
      const m1 = data._view.getUint8(pos);
      if ( m1 != 255 ) {
        pos = pos + 1;
      } else {
        const m2 = data._view.getUint8((pos + 1));
        if ( m2 == 255 ) {
          pos = pos + 1;
        } else {
          if ( m2 == 0 ) {
            pos = pos + 2;
          } else {
            if ( ((m2 == 192) || (m2 == 193)) || (m2 == 194) ) {
              if ( (pos + 9) < dataLen ) {
                result.bitsPerComponent = data._view.getUint8((pos + 4));
                result.height = this.readUint16BE(data, (pos + 5));
                result.width = this.readUint16BE(data, (pos + 7));
                result.colorComponents = data._view.getUint8((pos + 9));
                foundSOF = true;
              }
            } else {
              if ( m2 == 217 ) {
                pos = dataLen;
              } else {
                if ( m2 == 218 ) {
                  pos = dataLen;
                } else {
                  if ( (pos + 4) < dataLen ) {
                    const segLen = this.readUint16BE(data, (pos + 2));
                    pos = (pos + 2) + segLen;
                  } else {
                    pos = dataLen;
                  }
                }
              }
            }
          }
        }
      }
    };
    if ( foundSOF == false ) {
      result.errorMessage = "Could not find SOF marker in JPEG";
      return result;
    }
    result.imageData = data;
    result.isValid = true;
    return result;
  };
  getImageInfo (img) {
    if ( img.isValid == false ) {
      return "Invalid JPEG: " + img.errorMessage;
    }
    return ((((((("JPEG: " + ((img.width.toString()))) + "x") + ((img.height.toString()))) + " pixels, ") + ((img.colorComponents.toString()))) + " components, ") + ((img.bitsPerComponent.toString()))) + " bits";
  };
}
class ExifTag  {
  constructor() {
    this.tagId = 0;
    this.tagName = "";
    this.tagValue = "";
    this.dataType = 0;
  }
}
class JPEGMetadataInfo  {
  constructor() {
    this.isValid = false;
    this.errorMessage = "";
    this.hasJFIF = false;
    this.jfifVersion = "";
    this.densityUnits = 0;
    this.xDensity = 0;
    this.yDensity = 0;
    this.width = 0;
    this.height = 0;
    this.colorComponents = 0;
    this.bitsPerComponent = 0;
    this.hasExif = false;
    this.cameraMake = "";
    this.cameraModel = "";
    this.software = "";
    this.dateTime = "";
    this.dateTimeOriginal = "";
    this.exposureTime = "";
    this.fNumber = "";
    this.isoSpeed = "";
    this.focalLength = "";
    this.flash = "";
    this.orientation = 1;
    this.xResolution = "";
    this.yResolution = "";
    this.resolutionUnit = 0;
    this.hasGPS = false;
    this.gpsLatitude = "";
    this.gpsLongitude = "";
    this.gpsAltitude = "";
    this.gpsLatitudeRef = "";
    this.gpsLongitudeRef = "";
    this.hasComment = false;
    this.comment = "";
    this.exifTags = [];
  }
}
class JPEGMetadataParser  {
  constructor() {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.dataLen = 0;
    this.littleEndian = false;
  }
  readUint16BE (offset) {
    const high = this.data._view.getUint8(offset);
    const low = this.data._view.getUint8((offset + 1));
    return (high * 256) + low;
  };
  readUint16 (offset) {
    let result = 0;
    if ( this.littleEndian ) {
      const low = this.data._view.getUint8(offset);
      const high = this.data._view.getUint8((offset + 1));
      result = (high * 256) + low;
    } else {
      const high_1 = this.data._view.getUint8(offset);
      const low_1 = this.data._view.getUint8((offset + 1));
      result = (high_1 * 256) + low_1;
    }
    return result;
  };
  readUint32 (offset) {
    let result = 0;
    if ( this.littleEndian ) {
      const b0 = this.data._view.getUint8(offset);
      const b1 = this.data._view.getUint8((offset + 1));
      const b2 = this.data._view.getUint8((offset + 2));
      const b3 = this.data._view.getUint8((offset + 3));
      result = (((b3 * 16777216) + (b2 * 65536)) + (b1 * 256)) + b0;
    } else {
      const b0_1 = this.data._view.getUint8(offset);
      const b1_1 = this.data._view.getUint8((offset + 1));
      const b2_1 = this.data._view.getUint8((offset + 2));
      const b3_1 = this.data._view.getUint8((offset + 3));
      result = (((b0_1 * 16777216) + (b1_1 * 65536)) + (b2_1 * 256)) + b3_1;
    }
    return result;
  };
  readString (offset, length) {
    let result = "";
    let i = 0;
    while (i < length) {
      const b = this.data._view.getUint8((offset + i));
      if ( b == 0 ) {
        return result;
      }
      result = result + (String.fromCharCode(b));
      i = i + 1;
    };
    return result;
  };
  getTagName (tagId, ifdType) {
    if ( ifdType == 2 ) {
      if ( tagId == 0 ) {
        return "GPSVersionID";
      }
      if ( tagId == 1 ) {
        return "GPSLatitudeRef";
      }
      if ( tagId == 2 ) {
        return "GPSLatitude";
      }
      if ( tagId == 3 ) {
        return "GPSLongitudeRef";
      }
      if ( tagId == 4 ) {
        return "GPSLongitude";
      }
      if ( tagId == 5 ) {
        return "GPSAltitudeRef";
      }
      if ( tagId == 6 ) {
        return "GPSAltitude";
      }
      return "GPS_" + ((tagId.toString()));
    }
    if ( tagId == 256 ) {
      return "ImageWidth";
    }
    if ( tagId == 257 ) {
      return "ImageHeight";
    }
    if ( tagId == 258 ) {
      return "BitsPerSample";
    }
    if ( tagId == 259 ) {
      return "Compression";
    }
    if ( tagId == 262 ) {
      return "PhotometricInterpretation";
    }
    if ( tagId == 270 ) {
      return "ImageDescription";
    }
    if ( tagId == 271 ) {
      return "Make";
    }
    if ( tagId == 272 ) {
      return "Model";
    }
    if ( tagId == 274 ) {
      return "Orientation";
    }
    if ( tagId == 282 ) {
      return "XResolution";
    }
    if ( tagId == 283 ) {
      return "YResolution";
    }
    if ( tagId == 296 ) {
      return "ResolutionUnit";
    }
    if ( tagId == 305 ) {
      return "Software";
    }
    if ( tagId == 306 ) {
      return "DateTime";
    }
    if ( tagId == 315 ) {
      return "Artist";
    }
    if ( tagId == 33432 ) {
      return "Copyright";
    }
    if ( tagId == 33434 ) {
      return "ExposureTime";
    }
    if ( tagId == 33437 ) {
      return "FNumber";
    }
    if ( tagId == 34850 ) {
      return "ExposureProgram";
    }
    if ( tagId == 34855 ) {
      return "ISOSpeedRatings";
    }
    if ( tagId == 36864 ) {
      return "ExifVersion";
    }
    if ( tagId == 36867 ) {
      return "DateTimeOriginal";
    }
    if ( tagId == 36868 ) {
      return "DateTimeDigitized";
    }
    if ( tagId == 37377 ) {
      return "ShutterSpeedValue";
    }
    if ( tagId == 37378 ) {
      return "ApertureValue";
    }
    if ( tagId == 37380 ) {
      return "ExposureBiasValue";
    }
    if ( tagId == 37381 ) {
      return "MaxApertureValue";
    }
    if ( tagId == 37383 ) {
      return "MeteringMode";
    }
    if ( tagId == 37384 ) {
      return "LightSource";
    }
    if ( tagId == 37385 ) {
      return "Flash";
    }
    if ( tagId == 37386 ) {
      return "FocalLength";
    }
    if ( tagId == 37500 ) {
      return "MakerNote";
    }
    if ( tagId == 37510 ) {
      return "UserComment";
    }
    if ( tagId == 40960 ) {
      return "FlashpixVersion";
    }
    if ( tagId == 40961 ) {
      return "ColorSpace";
    }
    if ( tagId == 40962 ) {
      return "PixelXDimension";
    }
    if ( tagId == 40963 ) {
      return "PixelYDimension";
    }
    if ( tagId == 41486 ) {
      return "FocalPlaneXResolution";
    }
    if ( tagId == 41487 ) {
      return "FocalPlaneYResolution";
    }
    if ( tagId == 41488 ) {
      return "FocalPlaneResolutionUnit";
    }
    if ( tagId == 41495 ) {
      return "SensingMethod";
    }
    if ( tagId == 41728 ) {
      return "FileSource";
    }
    if ( tagId == 41729 ) {
      return "SceneType";
    }
    if ( tagId == 41985 ) {
      return "CustomRendered";
    }
    if ( tagId == 41986 ) {
      return "ExposureMode";
    }
    if ( tagId == 41987 ) {
      return "WhiteBalance";
    }
    if ( tagId == 41988 ) {
      return "DigitalZoomRatio";
    }
    if ( tagId == 41989 ) {
      return "FocalLengthIn35mmFilm";
    }
    if ( tagId == 41990 ) {
      return "SceneCaptureType";
    }
    if ( tagId == 34665 ) {
      return "ExifIFDPointer";
    }
    if ( tagId == 34853 ) {
      return "GPSInfoIFDPointer";
    }
    return "Tag_" + ((tagId.toString()));
  };
  formatRational (offset) {
    const numerator = this.readUint32(offset);
    const denominator = this.readUint32((offset + 4));
    if ( denominator == 0 ) {
      return (numerator.toString());
    }
    if ( denominator == 1 ) {
      return (numerator.toString());
    }
    return (((numerator.toString())) + "/") + ((denominator.toString()));
  };
  formatGPSCoordinate (offset, ref) {
    const degNum = this.readUint32(offset);
    const degDen = this.readUint32((offset + 4));
    const minNum = this.readUint32((offset + 8));
    const minDen = this.readUint32((offset + 12));
    const secNum = this.readUint32((offset + 16));
    const secDen = this.readUint32((offset + 20));
    let degrees = 0;
    if ( degDen > 0 ) {
      let tempDeg = degNum;
      while (tempDeg >= degDen) {
        tempDeg = tempDeg - degDen;
        degrees = degrees + 1;
      };
    }
    let minutes = 0;
    if ( minDen > 0 ) {
      let tempMin = minNum;
      while (tempMin >= minDen) {
        tempMin = tempMin - minDen;
        minutes = minutes + 1;
      };
    }
    let seconds = "0";
    if ( secDen > 0 ) {
      let secWhole = 0;
      let tempSec = secNum;
      while (tempSec >= secDen) {
        tempSec = tempSec - secDen;
        secWhole = secWhole + 1;
      };
      const secRem = tempSec;
      if ( secRem > 0 ) {
        let decPartTemp = secRem * 100;
        let decPart = 0;
        while (decPartTemp >= secDen) {
          decPartTemp = decPartTemp - secDen;
          decPart = decPart + 1;
        };
        if ( decPart < 10 ) {
          seconds = (((secWhole.toString())) + ".0") + ((decPart.toString()));
        } else {
          seconds = (((secWhole.toString())) + ".") + ((decPart.toString()));
        }
      } else {
        seconds = (secWhole.toString());
      }
    }
    return (((((((degrees.toString())) + "° ") + ((minutes.toString()))) + "' ") + seconds) + "\" ") + ref;
  };
  parseIFD (info, tiffStart, ifdOffset, ifdType) {
    let pos = tiffStart + ifdOffset;
    if ( (pos + 2) > this.dataLen ) {
      return;
    }
    const numEntries = this.readUint16(pos);
    pos = pos + 2;
    let i = 0;
    while (i < numEntries) {
      if ( (pos + 12) > this.dataLen ) {
        return;
      }
      const tagId = this.readUint16(pos);
      const dataType = this.readUint16((pos + 2));
      const numValues = this.readUint32((pos + 4));
      let valueOffset = pos + 8;
      let dataSize = 0;
      if ( dataType == 1 ) {
        dataSize = numValues;
      }
      if ( dataType == 2 ) {
        dataSize = numValues;
      }
      if ( dataType == 3 ) {
        dataSize = numValues * 2;
      }
      if ( dataType == 4 ) {
        dataSize = numValues * 4;
      }
      if ( dataType == 5 ) {
        dataSize = numValues * 8;
      }
      if ( dataType == 7 ) {
        dataSize = numValues;
      }
      if ( dataType == 9 ) {
        dataSize = numValues * 4;
      }
      if ( dataType == 10 ) {
        dataSize = numValues * 8;
      }
      if ( dataSize > 4 ) {
        valueOffset = tiffStart + this.readUint32((pos + 8));
      }
      const tagName = this.getTagName(tagId, ifdType);
      let tagValue = "";
      if ( dataType == 2 ) {
        tagValue = this.readString(valueOffset, numValues);
      }
      if ( dataType == 3 ) {
        if ( dataSize <= 4 ) {
          tagValue = (this.readUint16((pos + 8)).toString());
        } else {
          tagValue = (this.readUint16(valueOffset).toString());
        }
      }
      if ( dataType == 4 ) {
        if ( dataSize <= 4 ) {
          tagValue = (this.readUint32((pos + 8)).toString());
        } else {
          tagValue = (this.readUint32(valueOffset).toString());
        }
      }
      if ( dataType == 5 ) {
        tagValue = this.formatRational(valueOffset);
      }
      const tag = new ExifTag();
      tag.tagId = tagId;
      tag.tagName = tagName;
      tag.tagValue = tagValue;
      tag.dataType = dataType;
      info.exifTags.push(tag);
      if ( tagId == 271 ) {
        info.cameraMake = tagValue;
      }
      if ( tagId == 272 ) {
        info.cameraModel = tagValue;
      }
      if ( tagId == 305 ) {
        info.software = tagValue;
      }
      if ( tagId == 306 ) {
        info.dateTime = tagValue;
      }
      if ( tagId == 274 ) {
        info.orientation = this.readUint16((pos + 8));
      }
      if ( tagId == 282 ) {
        info.xResolution = tagValue;
      }
      if ( tagId == 283 ) {
        info.yResolution = tagValue;
      }
      if ( tagId == 296 ) {
        info.resolutionUnit = this.readUint16((pos + 8));
      }
      if ( tagId == 36867 ) {
        info.dateTimeOriginal = tagValue;
      }
      if ( tagId == 33434 ) {
        info.exposureTime = tagValue;
      }
      if ( tagId == 33437 ) {
        info.fNumber = tagValue;
      }
      if ( tagId == 34855 ) {
        info.isoSpeed = tagValue;
      }
      if ( tagId == 37386 ) {
        info.focalLength = tagValue;
      }
      if ( tagId == 37385 ) {
        const flashVal = this.readUint16((pos + 8));
        if ( (flashVal % 2) == 1 ) {
          info.flash = "Fired";
        } else {
          info.flash = "Did not fire";
        }
      }
      if ( tagId == 34665 ) {
        const exifOffset = this.readUint32((pos + 8));
        this.parseIFD(info, tiffStart, exifOffset, 1);
      }
      if ( tagId == 34853 ) {
        info.hasGPS = true;
        const gpsOffset = this.readUint32((pos + 8));
        this.parseIFD(info, tiffStart, gpsOffset, 2);
      }
      if ( ifdType == 2 ) {
        if ( tagId == 1 ) {
          info.gpsLatitudeRef = tagValue;
        }
        if ( tagId == 2 ) {
          info.gpsLatitude = this.formatGPSCoordinate(valueOffset, info.gpsLatitudeRef);
        }
        if ( tagId == 3 ) {
          info.gpsLongitudeRef = tagValue;
        }
        if ( tagId == 4 ) {
          info.gpsLongitude = this.formatGPSCoordinate(valueOffset, info.gpsLongitudeRef);
        }
        if ( tagId == 6 ) {
          const altNum = this.readUint32(valueOffset);
          const altDen = this.readUint32((valueOffset + 4));
          if ( altDen > 0 ) {
            let altWhole = 0;
            let tempAlt = altNum;
            while (tempAlt >= altDen) {
              tempAlt = tempAlt - altDen;
              altWhole = altWhole + 1;
            };
            const altRem = tempAlt;
            if ( altRem > 0 ) {
              let altDecTemp = altRem * 10;
              let altDec = 0;
              while (altDecTemp >= altDen) {
                altDecTemp = altDecTemp - altDen;
                altDec = altDec + 1;
              };
              info.gpsAltitude = ((((altWhole.toString())) + ".") + ((altDec.toString()))) + " m";
            } else {
              info.gpsAltitude = ((altWhole.toString())) + " m";
            }
          } else {
            info.gpsAltitude = ((altNum.toString())) + " m";
          }
        }
      }
      pos = pos + 12;
      i = i + 1;
    };
  };
  parseExif (info, appStart, appLen) {
    const header = this.readString(appStart, 4);
    if ( header != "Exif" ) {
      return;
    }
    info.hasExif = true;
    const tiffStart = appStart + 6;
    const byteOrder0 = this.data._view.getUint8(tiffStart);
    const byteOrder1 = this.data._view.getUint8((tiffStart + 1));
    if ( (byteOrder0 == 73) && (byteOrder1 == 73) ) {
      this.littleEndian = true;
    } else {
      if ( (byteOrder0 == 77) && (byteOrder1 == 77) ) {
        this.littleEndian = false;
      } else {
        return;
      }
    }
    const magic = this.readUint16((tiffStart + 2));
    if ( magic != 42 ) {
      return;
    }
    const ifd0Offset = this.readUint32((tiffStart + 4));
    this.parseIFD(info, tiffStart, ifd0Offset, 0);
  };
  parseJFIF (info, appStart, appLen) {
    const header = this.readString(appStart, 4);
    if ( header != "JFIF" ) {
      return;
    }
    info.hasJFIF = true;
    const verMajor = this.data._view.getUint8((appStart + 5));
    const verMinor = this.data._view.getUint8((appStart + 6));
    info.jfifVersion = (((verMajor.toString())) + ".") + ((verMinor.toString()));
    info.densityUnits = this.data._view.getUint8((appStart + 7));
    info.xDensity = this.readUint16BE((appStart + 8));
    info.yDensity = this.readUint16BE((appStart + 10));
  };
  parseComment (info, appStart, appLen) {
    info.hasComment = true;
    info.comment = this.readString(appStart, appLen);
  };
  parseMetadata (dirPath, fileName) {
    const info = new JPEGMetadataInfo();
    this.data = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    this.dataLen = this.data.byteLength;
    if ( this.dataLen < 4 ) {
      info.errorMessage = "File too small";
      return info;
    }
    const m1 = this.data._view.getUint8(0);
    const m2 = this.data._view.getUint8(1);
    if ( (m1 != 255) || (m2 != 216) ) {
      info.errorMessage = "Not a valid JPEG file";
      return info;
    }
    info.isValid = true;
    let pos = 2;
    while (pos < this.dataLen) {
      const marker1 = this.data._view.getUint8(pos);
      if ( marker1 != 255 ) {
        pos = pos + 1;
        continue;
      }
      const marker2 = this.data._view.getUint8((pos + 1));
      if ( marker2 == 255 ) {
        pos = pos + 1;
        continue;
      }
      if ( (marker2 == 216) || (marker2 == 217) ) {
        pos = pos + 2;
        continue;
      }
      if ( (marker2 >= 208) && (marker2 <= 215) ) {
        pos = pos + 2;
        continue;
      }
      if ( (pos + 4) > this.dataLen ) {
        return info;
      }
      const segLen = this.readUint16BE((pos + 2));
      const segStart = pos + 4;
      if ( marker2 == 224 ) {
        this.parseJFIF(info, segStart, segLen - 2);
      }
      if ( marker2 == 225 ) {
        this.parseExif(info, segStart, segLen - 2);
      }
      if ( marker2 == 254 ) {
        this.parseComment(info, segStart, segLen - 2);
      }
      if ( (marker2 == 192) || (marker2 == 194) ) {
        if ( (pos + 9) < this.dataLen ) {
          info.bitsPerComponent = this.data._view.getUint8((pos + 4));
          info.height = this.readUint16BE((pos + 5));
          info.width = this.readUint16BE((pos + 7));
          info.colorComponents = this.data._view.getUint8((pos + 9));
        }
      }
      if ( marker2 == 218 ) {
        return info;
      }
      if ( marker2 == 217 ) {
        return info;
      }
      pos = (pos + 2) + segLen;
    };
    return info;
  };
  formatMetadata (info) {
    const out = new GrowableBuffer();
    out.writeString("=== JPEG Metadata ===\n\n");
    if ( info.isValid == false ) {
      out.writeString(("Error: " + info.errorMessage) + "\n");
      return (out).toString();
    }
    out.writeString("--- Image Info ---\n");
    out.writeString(((("  Dimensions: " + ((info.width.toString()))) + " x ") + ((info.height.toString()))) + "\n");
    out.writeString(("  Color Components: " + ((info.colorComponents.toString()))) + "\n");
    out.writeString(("  Bits per Component: " + ((info.bitsPerComponent.toString()))) + "\n");
    if ( info.hasJFIF ) {
      out.writeString("\n--- JFIF Info ---\n");
      out.writeString(("  Version: " + info.jfifVersion) + "\n");
      let densityStr = "No units (aspect ratio)";
      if ( info.densityUnits == 1 ) {
        densityStr = "pixels/inch";
      }
      if ( info.densityUnits == 2 ) {
        densityStr = "pixels/cm";
      }
      out.writeString(((((("  Density: " + ((info.xDensity.toString()))) + " x ") + ((info.yDensity.toString()))) + " ") + densityStr) + "\n");
    }
    if ( info.hasExif ) {
      out.writeString("\n--- EXIF Info ---\n");
      if ( (info.cameraMake.length) > 0 ) {
        out.writeString(("  Camera Make: " + info.cameraMake) + "\n");
      }
      if ( (info.cameraModel.length) > 0 ) {
        out.writeString(("  Camera Model: " + info.cameraModel) + "\n");
      }
      if ( (info.software.length) > 0 ) {
        out.writeString(("  Software: " + info.software) + "\n");
      }
      if ( (info.dateTimeOriginal.length) > 0 ) {
        out.writeString(("  Date/Time Original: " + info.dateTimeOriginal) + "\n");
      } else {
        if ( (info.dateTime.length) > 0 ) {
          out.writeString(("  Date/Time: " + info.dateTime) + "\n");
        }
      }
      if ( (info.exposureTime.length) > 0 ) {
        out.writeString(("  Exposure Time: " + info.exposureTime) + " sec\n");
      }
      if ( (info.fNumber.length) > 0 ) {
        out.writeString(("  F-Number: f/" + info.fNumber) + "\n");
      }
      if ( (info.isoSpeed.length) > 0 ) {
        out.writeString(("  ISO Speed: " + info.isoSpeed) + "\n");
      }
      if ( (info.focalLength.length) > 0 ) {
        out.writeString(("  Focal Length: " + info.focalLength) + " mm\n");
      }
      if ( (info.flash.length) > 0 ) {
        out.writeString(("  Flash: " + info.flash) + "\n");
      }
      let orientStr = "Normal";
      if ( info.orientation == 2 ) {
        orientStr = "Flip horizontal";
      }
      if ( info.orientation == 3 ) {
        orientStr = "Rotate 180";
      }
      if ( info.orientation == 4 ) {
        orientStr = "Flip vertical";
      }
      if ( info.orientation == 5 ) {
        orientStr = "Transpose";
      }
      if ( info.orientation == 6 ) {
        orientStr = "Rotate 90 CW";
      }
      if ( info.orientation == 7 ) {
        orientStr = "Transverse";
      }
      if ( info.orientation == 8 ) {
        orientStr = "Rotate 270 CW";
      }
      out.writeString(("  Orientation: " + orientStr) + "\n");
    }
    if ( info.hasGPS ) {
      out.writeString("\n--- GPS Info ---\n");
      if ( (info.gpsLatitude.length) > 0 ) {
        out.writeString(("  Latitude: " + info.gpsLatitude) + "\n");
      }
      if ( (info.gpsLongitude.length) > 0 ) {
        out.writeString(("  Longitude: " + info.gpsLongitude) + "\n");
      }
      if ( (info.gpsAltitude.length) > 0 ) {
        out.writeString(("  Altitude: " + info.gpsAltitude) + "\n");
      }
    }
    if ( info.hasComment ) {
      out.writeString("\n--- Comment ---\n");
      out.writeString(("  " + info.comment) + "\n");
    }
    const tagCount = info.exifTags.length;
    if ( tagCount > 0 ) {
      out.writeString(("\n--- All EXIF Tags (" + ((tagCount.toString()))) + ") ---\n");
      for ( let idx = 0; idx < info.exifTags.length; idx++) {
        var tag = info.exifTags[idx];
        out.writeString(("  " + tag.tagName) + " (0x");
        let tagHex = "";
        const tid = tag.tagId;
        const hexChars = "0123456789ABCDEF";
        const h3D = tid / 4096;
        const h3 = Math.floor( h3D);
        const r3 = tid - (h3 * 4096);
        const h2D = r3 / 256;
        const h2 = Math.floor( h2D);
        const r2 = r3 - (h2 * 256);
        const h1D = r2 / 16;
        const h1 = Math.floor( h1D);
        const h0 = r2 - (h1 * 16);
        tagHex = (((hexChars.substring(h3, (h3 + 1) )) + (hexChars.substring(h2, (h2 + 1) ))) + (hexChars.substring(h1, (h1 + 1) ))) + (hexChars.substring(h0, (h0 + 1) ));
        out.writeString(((tagHex + "): ") + tag.tagValue) + "\n");
      };
    }
    return (out).toString();
  };
}
class JPEGMetadataMain  {
  constructor() {
  }
}
class PDFWriter  {
  constructor() {
    this.nextObjNum = 1;
    this.objectOffsets = [];
    this.imageObjNum = 0;
    const buf = new GrowableBuffer();
    this.pdfBuffer = buf;
    const reader = new JPEGReader();
    this.jpegReader = reader;
    const parser = new JPEGMetadataParser();
    this.metadataParser = parser;
  }
  writeObject (content) {
    const buf = this.pdfBuffer;
    this.objectOffsets.push((buf).size());
    buf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    buf.writeString(content);
    buf.writeString("\nendobj\n\n");
    this.nextObjNum = this.nextObjNum + 1;
  };
  writeObjectGetNum (content) {
    const objNum = this.nextObjNum;
    this.writeObject(content);
    return objNum;
  };
  writeImageObject (header, imageData, footer) {
    const buf = this.pdfBuffer;
    this.objectOffsets.push((buf).size());
    buf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    buf.writeString(header);
    buf.writeBuffer(imageData);
    buf.writeString(footer);
    buf.writeString("\nendobj\n\n");
    const objNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    return objNum;
  };
  addJPEGImage (dirPath, fileName) {
    const reader = this.jpegReader;
    const img = reader.readJPEG(dirPath, fileName);
    if ( img.isValid == false ) {
      console.log("Error loading image: " + img.errorMessage);
      return 0;
    }
    console.log(reader.getImageInfo(img));
    const parser = this.metadataParser;
    const meta = parser.parseMetadata(dirPath, fileName);
    this.lastImageMetadata = meta;
    let colorSpace = "/DeviceRGB";
    if ( img.colorComponents == 1 ) {
      colorSpace = "/DeviceGray";
    }
    if ( img.colorComponents == 4 ) {
      colorSpace = "/DeviceCMYK";
    }
    const imgData = img.imageData;
    const dataLen = imgData.byteLength;
    let imgHeader = "<< /Type /XObject /Subtype /Image";
    imgHeader = (imgHeader + " /Width ") + ((img.width.toString()));
    imgHeader = (imgHeader + " /Height ") + ((img.height.toString()));
    imgHeader = (imgHeader + " /ColorSpace ") + colorSpace;
    imgHeader = (imgHeader + " /BitsPerComponent ") + ((img.bitsPerComponent.toString()));
    imgHeader = imgHeader + " /Filter /DCTDecode";
    imgHeader = (imgHeader + " /Length ") + ((dataLen.toString()));
    imgHeader = imgHeader + " >>\nstream\n";
    const imgFooter = "\nendstream";
    this.imageObjNum = this.writeImageObject(imgHeader, imgData, imgFooter);
    return this.imageObjNum;
  };
  escapeText (text) {
    let result = "";
    const __len = text.length;
    let i = 0;
    while (i < __len) {
      const ch = text.charCodeAt(i );
      if ( ch == 40 ) {
        result = result + "\\(";
      } else {
        if ( ch == 41 ) {
          result = result + "\\)";
        } else {
          if ( ch == 92 ) {
            result = result + "\\\\";
          } else {
            result = result + (String.fromCharCode(ch));
          }
        }
      }
      i = i + 1;
    };
    return result;
  };
  createHelloWorldPDF (message) {
    return this.createPDFWithImage(message, "", "");
  };
  createPDFWithImage (message, imageDirPath, imageFileName) {
    this.nextObjNum = 1;
    const buf = this.pdfBuffer;
    (buf).clear();
    this.imageObjNum = 0;
    this.objectOffsets.length = 0;
    buf.writeString("%PDF-1.4\n");
    buf.writeByte(37);
    buf.writeByte(226);
    buf.writeByte(227);
    buf.writeByte(207);
    buf.writeByte(211);
    buf.writeByte(10);
    let hasImage = (imageFileName.length) > 0;
    if ( hasImage ) {
      const imgNum = this.addJPEGImage(imageDirPath, imageFileName);
      if ( imgNum == 0 ) {
        hasImage = false;
      }
    }
    const catalogObjNum = this.nextObjNum;
    const pagesObjNum = this.nextObjNum + 1;
    this.writeObject(("<< /Type /Catalog /Pages " + ((pagesObjNum.toString()))) + " 0 R >>");
    const pageObjNum = this.nextObjNum + 1;
    this.writeObject(("<< /Type /Pages /Kids [" + ((pageObjNum.toString()))) + " 0 R] /Count 1 >>");
    const contentObjNum = this.nextObjNum + 1;
    const fontObjNum = this.nextObjNum + 2;
    let resourcesStr = ("<< /Font << /F1 " + ((fontObjNum.toString()))) + " 0 R >>";
    if ( hasImage ) {
      resourcesStr = ((resourcesStr + " /XObject << /Img1 ") + ((this.imageObjNum.toString()))) + " 0 R >>";
    }
    resourcesStr = resourcesStr + " >>";
    this.writeObject(((((("<< /Type /Page /Parent " + ((pagesObjNum.toString()))) + " 0 R /MediaBox [0 0 612 792] /Contents ") + ((contentObjNum.toString()))) + " 0 R /Resources ") + resourcesStr) + " >>");
    const streamBuf = new GrowableBuffer();
    if ( hasImage ) {
      streamBuf.writeString("q\n");
      streamBuf.writeString("150 0 0 150 400 600 cm\n");
      streamBuf.writeString("/Img1 Do\n");
      streamBuf.writeString("Q\n");
    }
    streamBuf.writeString("q\n");
    streamBuf.writeString("1 0 0 RG\n");
    streamBuf.writeString("1 0.8 0.8 rg\n");
    streamBuf.writeString("2 w\n");
    streamBuf.writeString("100 650 80 60 re\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0 0 1 RG\n");
    streamBuf.writeString("0.8 0.8 1 rg\n");
    streamBuf.writeString("2 w\n");
    streamBuf.writeString("220 650 m\n");
    streamBuf.writeString("280 650 l\n");
    streamBuf.writeString("250 710 l\n");
    streamBuf.writeString("h\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0 0.5 0 RG\n");
    streamBuf.writeString("0.8 1 0.8 rg\n");
    streamBuf.writeString("2 w\n");
    const cx = 370;
    const cy = 680;
    const r = 30;
    const k = 17;
    streamBuf.writeString((((((cx + r).toString())) + " ") + ((cy.toString()))) + " m\n");
    streamBuf.writeString((((((((((((((cx + r).toString())) + " ") + (((cy + k).toString()))) + " ") + (((cx + k).toString()))) + " ") + (((cy + r).toString()))) + " ") + ((cx.toString()))) + " ") + (((cy + r).toString()))) + " c\n");
    streamBuf.writeString((((((((((((((cx - k).toString())) + " ") + (((cy + r).toString()))) + " ") + (((cx - r).toString()))) + " ") + (((cy + k).toString()))) + " ") + (((cx - r).toString()))) + " ") + ((cy.toString()))) + " c\n");
    streamBuf.writeString((((((((((((((cx - r).toString())) + " ") + (((cy - k).toString()))) + " ") + (((cx - k).toString()))) + " ") + (((cy - r).toString()))) + " ") + ((cx.toString()))) + " ") + (((cy - r).toString()))) + " c\n");
    streamBuf.writeString((((((((((((((cx + k).toString())) + " ") + (((cy - r).toString()))) + " ") + (((cx + r).toString()))) + " ") + (((cy - k).toString()))) + " ") + (((cx + r).toString()))) + " ") + ((cy.toString()))) + " c\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0.8 0 0.2 RG\n");
    streamBuf.writeString("1 0.4 0.5 rg\n");
    streamBuf.writeString("2 w\n");
    streamBuf.writeString("140 480 m\n");
    streamBuf.writeString("90 510 80 560 110 580 c\n");
    streamBuf.writeString("130 595 140 580 140 565 c\n");
    streamBuf.writeString("140 580 150 595 170 580 c\n");
    streamBuf.writeString("200 560 190 510 140 480 c\n");
    streamBuf.writeString("h\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0 0.5 0.8 RG\n");
    streamBuf.writeString("2 w\n");
    const sx = 300;
    const sy = 530;
    const arm = 50;
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString(((((sx.toString())) + " ") + (((sy + arm).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString((((((sx + 43).toString())) + " ") + (((sy + 25).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString((((((sx + 43).toString())) + " ") + (((sy - 25).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString(((((sx.toString())) + " ") + (((sy - arm).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString((((((sx - 43).toString())) + " ") + (((sy - 25).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString((((((sx - 43).toString())) + " ") + (((sy + 25).toString()))) + " l\n");
    streamBuf.writeString((((((sx - 10).toString())) + " ") + ((((sy + arm) - 10).toString()))) + " m\n");
    streamBuf.writeString(((((sx.toString())) + " ") + (((sy + arm).toString()))) + " l\n");
    streamBuf.writeString((((((sx + 10).toString())) + " ") + ((((sy + arm) - 10).toString()))) + " l\n");
    streamBuf.writeString((((((sx - 10).toString())) + " ") + ((((sy - arm) + 10).toString()))) + " m\n");
    streamBuf.writeString(((((sx.toString())) + " ") + (((sy - arm).toString()))) + " l\n");
    streamBuf.writeString((((((sx + 10).toString())) + " ") + ((((sy - arm) + 10).toString()))) + " l\n");
    streamBuf.writeString("S\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0.8 0.6 0 RG\n");
    streamBuf.writeString("1 0.9 0.3 rg\n");
    streamBuf.writeString("2 w\n");
    streamBuf.writeString("460 575 m\n");
    streamBuf.writeString("472 545 l\n");
    streamBuf.writeString("505 545 l\n");
    streamBuf.writeString("478 522 l\n");
    streamBuf.writeString("488 490 l\n");
    streamBuf.writeString("460 508 l\n");
    streamBuf.writeString("432 490 l\n");
    streamBuf.writeString("442 522 l\n");
    streamBuf.writeString("415 545 l\n");
    streamBuf.writeString("448 545 l\n");
    streamBuf.writeString("h\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0.5 0.5 0.5 RG\n");
    streamBuf.writeString("1 w\n");
    streamBuf.writeString("50 450 m\n");
    streamBuf.writeString("562 450 l\n");
    streamBuf.writeString("S\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0.6 0 0.6 RG\n");
    streamBuf.writeString("3 w\n");
    streamBuf.writeString("50 400 m\n");
    streamBuf.writeString("150 450 200 350 300 400 c\n");
    streamBuf.writeString("400 450 450 350 550 400 c\n");
    streamBuf.writeString("S\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("BT\n");
    streamBuf.writeString("/F1 36 Tf\n");
    streamBuf.writeString("100 320 Td\n");
    streamBuf.writeString(("(" + this.escapeText(message)) + ") Tj\n");
    streamBuf.writeString("ET\n");
    streamBuf.writeString("BT\n");
    streamBuf.writeString("/F1 14 Tf\n");
    streamBuf.writeString("100 280 Td\n");
    streamBuf.writeString("(Generated by Ranger PDF Writer) Tj\n");
    streamBuf.writeString("ET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n100 630 Td\n(Rectangle) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n225 630 Td\n(Triangle) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n355 630 Td\n(Circle) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n125 465 Td\n(Heart) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n275 465 Td\n(Snowflake) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n445 465 Td\n(Star) Tj\nET\n");
    if ( hasImage ) {
      streamBuf.writeString("BT\n/F1 10 Tf\n400 585 Td\n(JPEG Image) Tj\nET\n");
      if ( (typeof(this.lastImageMetadata) !== "undefined" && this.lastImageMetadata != null )  ) {
        const meta = this.lastImageMetadata;
        let metaY = 240;
        streamBuf.writeString(("BT\n/F1 12 Tf\n400 " + ((metaY.toString()))) + " Td\n(Image Metadata:) Tj\nET\n");
        metaY = metaY - 14;
        streamBuf.writeString(((((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Size: ") + ((meta.width.toString()))) + " x ") + ((meta.height.toString()))) + ") Tj\nET\n");
        metaY = metaY - 12;
        if ( meta.hasExif ) {
          if ( (meta.cameraMake.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Make: ") + this.escapeText(meta.cameraMake)) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.cameraModel.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Model: ") + this.escapeText(meta.cameraModel)) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.dateTimeOriginal.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Date: ") + this.escapeText(meta.dateTimeOriginal)) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.exposureTime.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Exposure: ") + meta.exposureTime) + " sec) Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.fNumber.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Aperture: f/") + meta.fNumber) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.isoSpeed.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(ISO: ") + meta.isoSpeed) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.focalLength.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Focal Length: ") + meta.focalLength) + " mm) Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.flash.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Flash: ") + meta.flash) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
        }
        if ( meta.hasGPS ) {
          streamBuf.writeString(("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(--- GPS Data ---) Tj\nET\n");
          metaY = metaY - 12;
          if ( (meta.gpsLatitude.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Latitude: ") + meta.gpsLatitude) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.gpsLongitude.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Longitude: ") + meta.gpsLongitude) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.gpsAltitude.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Altitude: ") + meta.gpsAltitude) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
        }
      }
    }
    const streamLen = (streamBuf).size();
    const streamContent = (streamBuf).toString();
    this.writeObject(((("<< /Length " + ((streamLen.toString()))) + " >>\nstream\n") + streamContent) + "endstream");
    this.writeObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    let rootObjNum = 1;
    if ( hasImage ) {
      rootObjNum = 2;
    }
    const xrefOffset = (buf).size();
    buf.writeString("xref\n");
    buf.writeString(("0 " + ((this.nextObjNum.toString()))) + "\n");
    buf.writeString("0000000000 65535 f \n");
    for ( let i = 0; i < this.objectOffsets.length; i++) {
      var offset = this.objectOffsets[i];
      let offsetStr = (offset.toString());
      while ((offsetStr.length) < 10) {
        offsetStr = "0" + offsetStr;
      };
      buf.writeString(offsetStr + " 00000 n \n");
    };
    buf.writeString("trailer\n");
    buf.writeString(((("<< /Size " + ((this.nextObjNum.toString()))) + " /Root ") + ((rootObjNum.toString()))) + " 0 R >>\n");
    buf.writeString("startxref\n");
    buf.writeString(((xrefOffset.toString())) + "\n");
    buf.writeString("%%EOF\n");
    return buf.toBuffer();
  };
  savePDF (path, filename, message) {
    const pdfContent = this.createHelloWorldPDF(message);
    require('fs').writeFileSync(path + '/' + filename, Buffer.from(pdfContent));
    console.log((("PDF saved to " + path) + "/") + filename);
  };
  savePDFWithImage (path, filename, message, imageDirPath, imageFileName) {
    const pdfContent = this.createPDFWithImage(message, imageDirPath, imageFileName);
    require('fs').writeFileSync(path + '/' + filename, Buffer.from(pdfContent));
    console.log((("PDF saved to " + path) + "/") + filename);
  };
}
class Main  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  console.log("=== Ranger PDF Writer (Buffer-based) ===");
  const writer = new PDFWriter();
  writer.savePDF("./gallery/pdf_writer", "hello_world.pdf", "Hello, World!");
  writer.savePDFWithImage("./gallery/pdf_writer", "hello_with_image.pdf", "Hello, World!", "./gallery/pdf_writer", "Example.jpg");
  console.log("");
  console.log("--- Creating PDF with Canon_40D.jpg (EXIF metadata) ---");
  const writer2 = new PDFWriter();
  writer2.savePDFWithImage("./gallery/pdf_writer", "canon_with_metadata.pdf", "Canon 40D Sample Photo", "./gallery/pdf_writer", "Canon_40D.jpg");
  console.log("");
  console.log("--- Creating PDF with GPS_test.jpg (GPS metadata) ---");
  const writer3 = new PDFWriter();
  writer3.savePDFWithImage("./gallery/pdf_writer", "gps_with_metadata.pdf", "GPS Test Photo", "./gallery/pdf_writer", "GPS_test.jpg");
  console.log("");
  console.log("PDF generation complete!");
  console.log("Open gallery/pdf_writer/*.pdf to see results.");
}
__js_main();
