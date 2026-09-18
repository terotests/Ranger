import { View, Label, Svg } from "./evg_types";

/**
 * Imported SVG documents. Each <Svg> below names a file, and the file is read
 * once into the shared vector layer: groups resolved, paint inherited,
 * transforms baked into the geometry, <use> expanded where it is referenced.
 * What every target then draws is the same flat list of shapes — real vector
 * operators in the PDF, one <path> per shape in the HTML, and the same
 * anti-aliased scanline fill that paints this page's glyphs in the PNG.
 *
 * The HTML is worth a word: the original markup is NOT handed to the browser.
 * It goes through the importer like the other two, because a construct outside
 * the supported profile has to be missing from the preview in the same way it
 * will be missing from the print. A preview that draws more than the printer
 * can is not a preview.
 *
 * rosette.svg names no colours at all, so it takes the fill of the element that
 * hosts it and the theme paints it — the gallery's rule holding for a file it
 * does not own. emblem.svg brings its own palette, and keeps it.
 */
function render() {
  return (
    <View className="page">
      <Label className="title">Tuotu SVG</Label>
      <View className="rule" />

      <Label className="subhead">Yksi tiedosto, kolme kokoa</Label>
      <View className="row vecRow">
        <Svg className="art artSm" src="../assets/rosette.svg" />
        <Svg className="art artMd" src="../assets/rosette.svg" />
        <Svg className="art artLg" src="../assets/rosette.svg" />
      </View>
      <Label className="caption">
        Tiedostossa terälehti on määritelty kerran ja toistettu kahdeksana viittauksena, joista kukin on
        kierretty omaan kulmaansa. Tuonti purkaa viittaukset ja kirjoittaa kierrot suoraan geometriaan,
        joten piirtäjän ei tarvitse ylläpitää muunnospinoa — se piirtää listan muotoja.
      </Label>

      <Label className="subhead">Väri tulee sivulta, ei tiedostosta</Label>
      <View className="row vecRow">
        <Svg className="art artMd" src="../assets/rosette.svg" />
        <Svg className="art artMd artAccent" src="../assets/rosette.svg" />
        <Svg className="art artMd artMuted" src="../assets/rosette.svg" />
      </View>
      <Label className="caption">
        Sama tiedosto kolmesti. Se ei nimeä yhtään väriä, joten elementin täyttö on se, jonka muodot
        perivät — kuten käsin kirjoitetussa polussa. Ikonisarja voi siis noudattaa teemaa ilman että
        tiedostoja muokataan.
      </Label>

      <Label className="subhead">Tiedosto, jolla on oma paletti</Label>
      <View className="row vecRow">
        <Svg className="emblem emblemSm" src="../assets/emblem.svg" />
        <Svg className="emblem emblemLg" src="../assets/emblem.svg" />
      </View>
      <Label className="caption">
        Kilpi perii täyttönsä ryhmältä, nauha on kierretty ryhmä ja renkaan sisus on reikä eikä toinen
        levy — täyttösääntö tekee työnsä geometrialle, joka saapui tiedostosta eikä sivulta. Oman värinsä
        nimeävä tiedosto pitää sen, koska sen oma arvo voittaa perityn.
      </Label>
    </View>
  );
}
