export interface Produkt {
  id: number;
  name: string;
  meldebestand_kaesten: number;
}

export interface Charge {
  id: number;
  produkt_id: number;
  kaesten_anzahl: number;
  mhd_monat: number;
  mhd_jahr: number;
}

export interface NachschubAnfrage {
  id: number;
  produkt_id: number;
  name: string;
  zeitstempel: string;
  status: string;
}

export interface LogbuchEintrag {
  id: number;
  zeitstempel: string;
  differenz: number;
  grund: string;
  benutzerrolle: string;
  produkt_name: string | null;
}

export interface SyncItem {
  produkt_id: number;
  charge_id: number;
  differenz: number;
  grund: string;
  benutzerrolle: string;
  timestamp: string;
}
