"""
Module for aggregating court records from civil and labor jurisdictions by year and type.

This module processes previously normalized civil and labor court records, aggregates
their values provincially (grouping by year and type), adds a jurisdiction ('fuero')
column, and saves the consolidated result as a Parquet file.
"""

import os
import pandas as pd


def aggregate_jurisdiction_data(
    input_parquet_path: str, fuero_name: str
) -> pd.DataFrame:
    """
    Loads normalized records for a specific jurisdiction and aggregates values by year and type.

    Assumptions:
        - input_parquet_path is a valid path to a normalized court records Parquet file.
        - The input file contains 'anio', 'tipo', and 'valor' columns.
        - fuero_name is a string representing the jurisdiction (e.g. 'civil' or 'trabajo').

    Guarantees:
        - Returns a DataFrame containing 'anio', 'fuero', 'tipo', and 'valor' columns.
        - The output is grouped by 'anio' and 'tipo' with summed values.
    """
    if not os.path.exists(input_parquet_path):
        raise FileNotFoundError(f"Input file not found: {input_parquet_path}")

    # Load normalized parquet file
    df = pd.read_parquet(input_parquet_path)

    # Group by year and activity type, then sum the values to get provincial totals
    aggregated = df.groupby(["anio", "tipo"], as_index=False)["valor"].sum()

    # Assign the jurisdiction identifier
    aggregated["fuero"] = fuero_name

    # Return standard columns
    return aggregated[["anio", "fuero", "tipo", "valor"]]


def main() -> None:
    """
    Main function to orchestrate the aggregation of civil and labor court records.
    """
    output_dir = "parquet"
    civil_input = os.path.join(output_dir, "juzgados_civiles_unificados.parquet")
    trabajo_input = os.path.join(output_dir, "tribunales_trabajo_unificados.parquet")
    output_parquet = os.path.join(output_dir, "causas_agregadas.parquet")

    print("Aggregating court records...")

    try:
        # Process civil and labor datasets independently
        civil_aggregated = aggregate_jurisdiction_data(civil_input, "civil")
        trabajo_aggregated = aggregate_jurisdiction_data(trabajo_input, "trabajo")

        # Combine both datasets
        combined_df = pd.concat([civil_aggregated, trabajo_aggregated], ignore_index=True)

        # Sort for clean presentation
        combined_df = combined_df.sort_values(by=["anio", "fuero", "tipo"]).reset_index(drop=True)

        # Save to parquet directory
        combined_df.to_parquet(output_parquet, index=False)
        print(f"Successfully saved aggregated data to: {output_parquet} ({len(combined_df)} rows)")

    except Exception as e:
        print(f"Error during data aggregation: {e}")
        raise


if __name__ == "__main__":
    main()
