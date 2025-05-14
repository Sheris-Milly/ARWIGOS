import pandas as pd
import requests
import datetime as dt

class NoStockDataError(Exception):
    pass

def get_google_data(symbol, frequency=60, window=1, exchange='NASDAQ'):
    """
    Fetch intraday data for `symbol` from Google Finance’s getprices endpoint.
    Returns a DataFrame with columns:
      ['datetime','open','high','low','close','volume'].
    window=1 means “today only.”
    """
    url = (
        f"http://www.google.com/finance/getprices?"
        f"i={frequency}&p={window}d&f=d,o,h,l,c,v"
        f"&df=cpct&q={symbol}&x={exchange}"
    )
    r = requests.get(url)
    r.raise_for_status()
    lines = r.text.splitlines()

    # find the “DATA=” marker
    try:
        start = lines.index("DATA=") + 1
    except ValueError:
        raise NoStockDataError(f"No data for {symbol}")

    rows = []
    anchor = None
    for line in lines[start:]:
        if not line:
            continue
        parts = line.split(',')
        t = parts[0]
        if t.startswith('a'):
            anchor = int(t[1:])
            ts = anchor
        else:
            if anchor is None:
                continue
            offset = int(t)
            ts = anchor + offset * frequency

        o, h, l, c, v = map(float, parts[1:])
        rows.append({
            'datetime': dt.datetime.fromtimestamp(ts),
            'open': o, 'high': h, 'low': l,
            'close': c, 'volume': v
        })

    if not rows:
        raise NoStockDataError(f"No records for {symbol}")

    return pd.DataFrame(rows)


def get_current_price(symbol, exchange='NASDAQ') -> float:
    """
    Returns the most recent 'close' price for `symbol`
    by pulling today’s intraday and taking the last row.
    """
    df = get_google_data(symbol, frequency=60, window=1, exchange=exchange)
    return df['close'].iloc[-1]


if __name__ == "__main__":
    for sym in ["AAPL", "GOOG", "MSFT"]:
        try:
            price = get_current_price(sym)
            print(f"{sym} → ${price:.2f}")
        except Exception as e:
            print(f"{sym} → ERROR: {e}")
