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


export interface ConsolidatedRecord {
	anio: number;
	fuero: 'civil' | 'trabajo';
	tipo: string;
	valor: number;
}

export interface DatasetState {
	loading: boolean;
	error: string | null;
	records: CourtRecord[];
	sedes: string[];
	anios: number[];
	selectedFuero: 'civil' | 'trabajo' | null;
	consolidatedRecords: ConsolidatedRecord[];
	consolidatedAnios: number[];
}

// Helper to get initial fuero from localStorage
const getInitialFuero = (): 'civil' | 'trabajo' | null => {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('selectedFuero');
		if (stored === 'civil' || stored === 'trabajo') {
			return stored;
		}
	}
	return null;
};

// Global reactive state for Svelte 5 using runes
export const db = $state<DatasetState>({
	loading: true,
	error: null,
	records: [],
	sedes: [],
	anios: [],
	selectedFuero: getInitialFuero(),
	consolidatedRecords: [],
	consolidatedAnios: []
});

/**
 * Loads the CSV dataset, normalizes seat naming, groups long format
 * into structured objects, and updates the global reactive state.
 */
export async function loadDataset(forceFuero?: 'civil' | 'trabajo'): Promise<void> {
	const fuero = forceFuero || db.selectedFuero;
	if (!fuero) {
		db.loading = false;
		return;
	}

	// Avoid duplicate load for the same fuero if data already exists
	if (db.selectedFuero === fuero && db.records.length > 0 && !db.error) {
		db.loading = false;
		return;
	}

	db.loading = true;
	db.error = null;
	db.records = [];

	try {
		const csvFile = fuero === 'civil' ? 'juzgados_civiles_unificados.csv' : 'tribunales_trabajo_unificados.csv';
		const response = await fetch(`${base}/data/${csvFile}`);
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
				db.selectedFuero = fuero;
				db.loading = false;

				if (typeof window !== 'undefined') {
					localStorage.setItem('selectedFuero', fuero);
				}
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

/**
 * Loads the consolidated dataset containing aggregated provincial data for both jurisdictions.
 */
export async function loadConsolidatedDataset(): Promise<void> {
	// Avoid duplicate load if data already exists
	if (db.consolidatedRecords.length > 0 && !db.error) {
		db.loading = false;
		return;
	}

	db.loading = true;
	db.error = null;
	db.consolidatedRecords = [];

	try {
		const response = await fetch(`${base}/data/causas_agregadas.csv`);
		if (!response.ok) {
			throw new Error(`Failed to load consolidated dataset: ${response.statusText}`);
		}
		const csvText = await response.text();

		Papa.parse(csvText, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				const rawRows = results.data as Array<{
					anio: string;
					fuero: string;
					tipo: string;
					valor: string;
				}>;

				const consolidatedRecords: ConsolidatedRecord[] = [];

				for (const row of rawRows) {
					const anio = parseInt(row.anio);
					const fuero = row.fuero;
					const tipo = row.tipo;
					const valor = parseInt(row.valor) || 0;

					if (isNaN(anio) || (fuero !== 'civil' && fuero !== 'trabajo') || !tipo) continue;

					consolidatedRecords.push({
						anio,
						fuero: fuero as 'civil' | 'trabajo',
						tipo,
						valor
					});
				}

				const consolidatedAnios = Array.from(new Set(consolidatedRecords.map((r) => r.anio))).sort((a, b) => a - b);

				db.consolidatedRecords = consolidatedRecords;
				db.consolidatedAnios = consolidatedAnios;
				db.loading = false;
			},
			error: (error: any) => {
				db.error = `Error parsing consolidated CSV: ${error.message}`;
				db.loading = false;
			}
		});
	} catch (err: any) {
		db.error = err.message || 'Unknown error while fetching consolidated dataset';
		db.loading = false;
	}
}

