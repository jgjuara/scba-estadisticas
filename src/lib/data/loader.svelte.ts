import Papa from 'papaparse';
import { base } from '$app/paths';

export interface CourtRecord {
	anio: number;
	sede: string;
	ingresadas: number;
	sentencia: number;
	conciliacion: number;
	allanamiento: number;
	transaccion: number;
	caducidad: number;
	desistimiento: number;
	interlocutorios: number;
	incompetencia: number;
	totalResueltas: number;
}

export interface DatasetState {
	loading: boolean;
	error: string | null;
	records: CourtRecord[];
	sedes: string[];
	anios: number[];
}

// Global reactive state for Svelte 5 using runes
export const db = $state<DatasetState>({
	loading: true,
	error: null,
	records: [],
	sedes: [],
	anios: []
});

/**
 * Loads the CSV dataset, normalizes seat naming, groups long format
 * into structured objects, and updates the global reactive state.
 */
export async function loadDataset(): Promise<void> {
	if (db.records.length > 0) {
		// Prevent reloading if already loaded
		return;
	}

	try {
		const response = await fetch(`${base}/data/tribunales_trabajo_unificados.csv`);
		if (!response.ok) {
			throw new Error(`Failed to load dataset: ${response.statusText}`);
		}
		const csvText = await response.text();

		Papa.parse(csvText, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				const rawRows = results.data as Array<{
					anio: string;
					'departamento/sede': string;
					tipo: string;
					valor: string;
				}>;

				const groups: { [key: string]: CourtRecord } = {};

				for (const row of rawRows) {
					const anio = parseInt(row.anio);
					let sede = row['departamento/sede'];
					const tipo = row.tipo;
					const valor = parseInt(row.valor) || 0;

					if (isNaN(anio) || !sede || !tipo) continue;

					// Specific Zarate-Campana territorial consolidation
					if (
						sede === 'ZARATE-CAMPANA Sede CAMPANA' ||
						sede === 'ZARATE-CAMPANA Sede ZARATE'
					) {
						sede = 'ZARATE-CAMPANA';
					}

					const key = `${anio}|${sede}`;

					if (!groups[key]) {
						groups[key] = {
							anio,
							sede,
							ingresadas: 0,
							sentencia: 0,
							conciliacion: 0,
							allanamiento: 0,
							transaccion: 0,
							caducidad: 0,
							desistimiento: 0,
							interlocutorios: 0,
							incompetencia: 0,
							totalResueltas: 0
						};
					}

					const record = groups[key];

					switch (tipo) {
						case 'Ingresadas':
							record.ingresadas += valor;
							break;
						case 'Sentencia':
							record.sentencia += valor;
							break;
						case 'Conciliación':
							record.conciliacion += valor;
							break;
						case 'Allanamiento':
							record.allanamiento += valor;
							break;
						case 'Transacción':
							record.transaccion += valor;
							break;
						case 'Caducidad':
							record.caducidad += valor;
							break;
						case 'Desistimiento':
							record.desistimiento += valor;
							break;
						case 'Interlocutorios':
							record.interlocutorios += valor;
							break;
						case 'Incompetencia':
							record.incompetencia += valor;
							break;
						case 'Total Resueltas':
							record.totalResueltas += valor;
							break;
					}
				}

				const records = Object.values(groups);

				// Extract unique attributes
				const sedes = Array.from(new Set(records.map((r) => r.sede))).sort();
				const anios = Array.from(new Set(records.map((r) => r.anio))).sort((a, b) => a - b);

				// Update global reactive state
				db.records = records;
				db.sedes = sedes;
				db.anios = anios;
				db.loading = false;
			},
			error: (error: any) => {
				db.error = `Error parsing CSV: ${error.message}`;
				db.loading = false;
			}
		});
	} catch (err: any) {
		db.error = err.message || 'Unknown error while fetching dataset';
		db.loading = false;
	}
}
