import { View, Label, Path } from "./evg_types";

/**
 * Vector paths. Every shape below is the SAME path data in all three targets —
 * real vector operators in the PDF, an inline <svg> in the HTML, and an
 * anti-aliased scanline fill in the PNG — because they share one path parser,
 * one viewBox transform and, on the raster side, the same rasterizer that
 * paints the glyphs on this page.
 *
 * Nothing here carries a colour or a size. `d` and `viewBox` are geometry, not
 * appearance: the theme decides how large a shape is drawn and what colour it
 * is filled with, and the shape does not change when it moves between themes
 * or between targets.
 */
function render() {
  return (
    <View className="page">
      <Label className="title">Vektoripolut</Label>
      <View className="rule" />

      <Label className="subhead">Sama viewBox, kolme kokoa</Label>
      <View className="row vecRow">
        <Path className="icon iconSm" viewBox="0 0 24 24" d="M4 12 L10 18 L20 6" />
        <Path className="icon iconMd" viewBox="0 0 24 24" d="M4 12 L10 18 L20 6" />
        <Path className="icon iconLg" viewBox="0 0 24 24" d="M4 12 L10 18 L20 6" />
      </View>
      <Label className="caption">
        viewBox pitää muotoilun mittakaavasta riippumattomana: sama 24×24 ruudukko skaalataan laatikkoon,
        eikä piirroksen ympärille jätetty tyhjä tila katoa suurennettaessa.
      </Label>

      <Label className="subhead">Reiät ja täyttösääntö</Label>
      <View className="row vecRow">
        <Path
          className="shape"
          viewBox="0 0 100 100"
          d="M10,50 A40 40 0 1 0 90,50 A40 40 0 1 0 10,50 Z M30,50 A20 20 0 1 1 70,50 A20 20 0 1 1 30,50 Z"
        />
        <Path
          className="shape"
          viewBox="0 0 100 100"
          d="M10,10 L90,10 L90,90 L10,90 Z M30,30 L70,30 L70,70 L30,70 Z"
        />
        <Path
          className="shape evenodd"
          viewBox="0 0 100 100"
          d="M10,10 L90,10 L90,90 L10,90 Z M30,30 L70,30 L70,70 L30,70 Z"
        />
      </View>
      <Label className="caption">
        Ensimmäisessä renkaat kiertävät vastakkain, joten nollasta poikkeava sääntö jättää reiän.
        Kaksi jälkimmäistä ovat täsmälleen sama polku, jossa molemmat renkaat kiertävät samaan suuntaan:
        nollasta poikkeava sääntö täyttää sen umpeen, evenodd puhkaisee reiän.
      </Label>

      <Label className="subhead">Käyrät ja kaaret</Label>
      <View className="row vecRow">
        <Path className="shape" viewBox="5 15 90 70" d="M10,80 C10,20 90,20 90,80 Z" />
        <Path className="shape" viewBox="5 15 90 70" d="M10,80 Q50,10 90,80 Z" />
        <Path
          className="shape"
          viewBox="0 0 50 50"
          d="M50,25 C50,11.2 38.8,0 25,0 S0,11.2 0,25 S11.2,50 25,50 S50,38.8 50,25 Z"
        />
        <Path className="shape" viewBox="15 45 70 40" d="M20,80 A30 30 0 0 1 80,80 L65,80 A15 15 0 0 0 35,80 Z" />
      </View>
      <Label className="caption">
        Kuutio- ja neliökäyrä, S-komennoilla kirjoitettu ympyrä ja elliptinen kaari. Peilatut ohjauspisteet ja
        kaaret puretaan kerran polkukerroksessa, joten jokainen kohde saa ne samanlaisina.
      </Label>
    </View>
  );
}
