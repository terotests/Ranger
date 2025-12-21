// test_scandinavian.tsx - Testaa skandinaavisia kirjaimia (Ä, Ö, Å)
// Testataan Go-käännöksen Unicode-tuki

import { Print, Section, Page, View, Label, Image } from "./evg_types";
import {
  TitlePage,
  TitlePageWithPhoto,
  FullPagePhotoWithCaption,
  PhotoCaptionBelow,
} from "../components/PhotoLayouts";

// Käytetään testiä varten iPhone-kuvaa
const testPhoto = "../assets/images/IMG_5931.jpg";

function render() {
  return (
    <Print
      title="Skandinaaviset Kirjaimet Testi"
      author="Tero Tolonen"
      imageQuality="85"
      maxImageSize="1200"
    >
      <Section pageWidth="595" pageHeight="842" margin="0">
        {/* Sivu 1: Otsikkosivu suomeksi - käytä Noto Sans fonttia */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#2c3e50" justifyContent="center" alignItems="center">
            <Label fontSize="48px" fontFamily="Noto Sans" color="white" textAlign="center">Kesämuistot 2024</Label>
            <Label fontSize="24px" fontFamily="Noto Sans" color="white" marginTop="20px" textAlign="center">Äidin ja Isän Matkakirja</Label>
          </View>
        </Page>

        {/* Sivu 2: Otsikko kuvan päällä */}
        <Page>
          <TitlePageWithPhoto
            title="Löytöretki Lappiin"
            subtitle="Ylläkseltä Äkäslompoloon"
            backgroundSrc={testPhoto}
            overlayColor="rgba(0,0,0,0.5)"
          />
        </Page>

        {/* Sivu 3: Kuva tekstillä */}
        <Page>
          <FullPagePhotoWithCaption
            src={testPhoto}
            caption="Kaunis päivä Oulujärven rannalla - täällä oli ihana säätila!"
          />
        </Page>

        {/* Sivu 4: Tekstisivu skandinaavisilla kirjaimilla */}
        <Page>
          <View width="100%" height="100%" padding="50px" backgroundColor="#f8f9fa">
            <Label fontSize="28px" fontFamily="Noto Sans" fontWeight="bold" color="#2c3e50" marginBottom="20px">
              Äitienpäivä Helsingissä
            </Label>
            
            <Label fontSize="16px" fontFamily="Noto Sans" color="#34495e" lineHeight="1.6" marginBottom="15px">
              Vietimme upean päivän Helsingin keskustassa. Kävimme ensin Stockmannilla 
              ostoksilla ja sitten söimme lounasta Kämp-hotellissa.
            </Label>
            
            <Label fontSize="16px" fontFamily="Noto Sans" color="#34495e" lineHeight="1.6" marginBottom="15px">
              Öljyvärimaalaukset Ateneumissa olivat upeita! Erityisesti pidin 
              Akseli Gallen-Kallelan teoksista.
            </Label>
            
            <Label fontSize="16px" fontFamily="Noto Sans" color="#34495e" lineHeight="1.6" marginBottom="15px">
              Ruotsin puolelta Åland-saaret näkyivät kauniisti laivan kannelta.
              Mökillä grillasin lohta ja söimme perunoita.
            </Label>
            
            <Label fontSize="20px" fontFamily="Noto Sans" fontWeight="bold" color="#e74c3c" marginTop="30px">
              Erikoismerkit: Ä Ö Å ä ö å
            </Label>
            
            <Label fontSize="14px" fontFamily="Noto Sans" color="#7f8c8d" marginTop="20px">
              € £ ¥ © ® ™ • — – « » " " ' '
            </Label>
          </View>
        </Page>        {/* Sivu 5: Kuva kuvatekstillä */}
        <Page>
          <PhotoCaptionBelow
            src={testPhoto}
            caption="Joulukuusi Senaatintorilla - lämpötila oli -15°C"
            backgroundColor="#ffffff"
          />
        </Page>
      </Section>
    </Print>
  );
}
