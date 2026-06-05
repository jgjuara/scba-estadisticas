"""
Script to export unified Parquet files to CSV format.

This script reads all .parquet files in the 'parquet' directory and writes
them as .csv files in the same directory.
"""

import os
import glob
import pandas as pd


def export_parquet_files(parquet_dir: str) -> None:
    """
    Reads all Parquet files in the given directory and exports them to CSV.

    Assumptions:
        - parquet_dir is a valid directory containing .parquet files.

    Guarantees:
        - For each .parquet file found, a .csv file is created in the same path.
    """
    if not os.path.isdir(parquet_dir):
        raise FileNotFoundError(f"Directory '{parquet_dir}' does not exist.")

    parquet_files = glob.glob(os.path.join(parquet_dir, "*.parquet"))
    if not parquet_files:
        print("No Parquet files found to export.")
        return

    static_data_dir = os.path.join("static", "data")
    os.makedirs(static_data_dir, exist_ok=True)

    print(f"Found {len(parquet_files)} Parquet files to export.")
    for path in parquet_files:
        csv_path = path.replace(".parquet", ".csv")
        filename = os.path.basename(csv_path)
        static_csv_path = os.path.join(static_data_dir, filename)
        print(f"Exporting: {path} -> {csv_path} and {static_csv_path}")
        try:
            df = pd.read_parquet(path)
            # Save to parquet folder
            df.to_csv(csv_path, index=False, encoding="utf-8")
            # Save to frontend static folder
            df.to_csv(static_csv_path, index=False, encoding="utf-8")
            print(f"  [OK] Exported {len(df)} rows.")
        except Exception as e:
            print(f"  [ERROR] Failed to export {path}: {e}")


def main() -> None:
    """
    Main orchestration function.
    """
    parquet_dir = "parquet"
    export_parquet_files(parquet_dir)


if __name__ == "__main__":
    main()
