import pandas as pd
from typing import List
from app.models.schemas import DailyData


def prepare_time_series(daily_data: List[DailyData]) -> pd.DataFrame:
    """
    Chuyển list DailyData thành DataFrame liên tục theo ngày.
    Ngày thiếu (không có giao dịch) được điền bằng 0 — giả định ngày nghỉ/không bán.
    """
    if not daily_data:
        return pd.DataFrame(columns=["date", "quantity_out", "quantity_in"])

    df = pd.DataFrame([
        {"date": d.date, "quantity_out": d.quantity_out, "quantity_in": d.quantity_in}
        for d in daily_data
    ])
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").drop_duplicates(subset=["date"])

    # Fill khoảng trống ngày tháng để chuỗi thời gian liên tục
    if len(df) > 1:
        full_range = pd.date_range(df["date"].min(), df["date"].max(), freq="D")
        df = (
            df.set_index("date")
            .reindex(full_range, fill_value=0)
            .reset_index()
            .rename(columns={"index": "date"})
        )

    return df
