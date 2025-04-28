const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

// SETT INN DIN API-NØKKEL HER
const API_KEY = 'da71a803-93be-4c85-bd63-740c575c0409';

app.get('/api/vegvesen', async (req, res) => {
    const regnr = (req.query.regnr || '').toString().trim().toUpperCase();
    if (!regnr) {
      return res.status(400).json({ error: "Mangler regnr" });
    }
  
    const url = `https://www.vegvesen.no/ws/no/vegvesen/kjoretoy/felles/datautlevering/enkeltoppslag/kjoretoydata?kjennemerke=${regnr}`;
    const headers = { "SVV-Authorization": `Apikey ${API_KEY}` };
  
    try {
      const response = await fetch(url, { method: "GET", headers });
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: "Fant ikke kjøretøydata", status: response.status });
      }
  
      const json = await response.json();
      const kd = json.kjoretoydataListe?.[0] || {};
      const td = kd.godkjenning?.tekniskGodkjenning?.tekniskeData || {};
      const gen = td.generelt || {};
      const effektKW = td.motorOgDrivverk?.motor?.[0]?.maksNettoEffekt;
      const effektHK = effektKW ? Math.round(Number(effektKW) * 1.36) : "";

      const co2Verdi =
        td.miljodata?.miljoOgdrivstoffGruppe?.[0]?.forbrukOgUtslipp?.[0]?.co2Kombinert;

      const data = {
        merke: gen.merke?.[0]?.merke || "",
        modell: gen.handelsbetegnelse?.[0] || "",
        aar:
          kd.registrering?.registreringsaar ||
          kd.godkjenning?.forstegangsGodkjenning?.forstegangRegistrertDato?.substring(0, 4) ||
          kd.forstegangsregistrering?.registrertForstegangNorgeDato?.substring(0, 4) ||
          gen.modellår?.toString() ||
          "",
        drivstoff: td.miljodata?.miljoOgdrivstoffGruppe?.[0]?.drivstoffKodeMiljodata?.kodeNavn || "",
        farge: td.karosseriOgLasteplan?.rFarge?.[0]?.kodeNavn || "",
        girkasse: td.motorOgDrivverk?.girkassetype?.kodeNavn || "",
        hjuldrift: td.akslinger?.forbindelseMellomDrivaksler?.kodeNavn || "",
        effekt: effektHK, // Nå i hestekrefter!
        sylindervolum: td.motorOgDrivverk?.motor?.[0]?.slagvolum?.toString() || "",
        vekt: td.vekter?.egenvekt?.toString() || "",
        co2: co2Verdi !== undefined && co2Verdi !== null ? co2Verdi.toString() : "",
        seter: td.persontall?.sitteplasserTotalt?.toString() || "",
        dorer: td.karosseriOgLasteplan?.antallDorer?.[0]?.toString() || "",
        eu_kontroll: kd.periodiskKjoretoyKontroll?.kontrollfrist || "",
        regnr: kd.kjoretoyId?.kjennemerke || "",
        vin: kd.kjoretoyId?.understellsnummer || "",
        km: kd.godkjenning?.forstegangsGodkjenning?.bruktimport?.kilometerstand?.toString() || ""
      };
  
      return res.json(data);
    } catch (err) {
      return res
        .status(500)
        .json({ error: "Feil ved henting fra Vegvesen", details: err.message });
    }
  });
  
  
  
app.listen(3000, () => console.log('Proxy running on port 3000'));