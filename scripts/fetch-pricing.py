#!/usr/bin/env python3
"""
Fetch Azure Monitor pricing data for all configured regions.

Usage:
    python3 scripts/fetch-pricing.py

Outputs JSON to stdout. Redirect to save a snapshot:
    python3 scripts/fetch-pricing.py > scripts/pricing-snapshot.json

Compare with previous snapshot to detect price changes:
    diff <(python3 scripts/fetch-pricing.py) scripts/pricing-snapshot.json
"""

import json
import sys
import urllib.parse
import urllib.request
from datetime import date

API = "https://prices.azure.com/api/retail/prices"

REGIONS = [
    "eastus", "eastus2", "centralus", "westus", "westus2", "westus3",
    "northcentralus", "southcentralus", "westcentralus",
    "australiaeast", "canadacentral", "japanwest", "koreacentral",
    "swedencentral", "westeurope",
]

TIER_LEVELS = [100, 200, 300, 400, 500, 1000, 2000, 5000, 10000, 25000, 50000]


def fetch_all(filter_str):
    url = f"{API}?$filter={urllib.parse.quote(filter_str)}&$top=200"
    items = []
    while url:
        with urllib.request.urlopen(url) as resp:
            data = json.loads(resp.read())
            items.extend(data["Items"])
            url = data.get("NextPageLink")
    return items


def find_meter(items, meter_name, tier_min=None):
    for i in items:
        if i["meterName"] == meter_name:
            if tier_min is None or i["tierMinimumUnits"] == tier_min:
                return i["retailPrice"]
    return None


def fetch_region(region):
    base = "currencyCode eq 'USD' and priceType eq 'Consumption'"
    monitor = fetch_all(f"{base} and serviceName eq 'Azure Monitor' and armRegionName eq '{region}'")
    la = fetch_all(f"{base} and serviceName eq 'Log Analytics' and armRegionName eq '{region}'")
    all_items = monitor + la

    payg = find_meter(all_items, "Analytics Logs Data Ingestion", 5.0) or 0
    basic = find_meter(all_items, "Basic Logs Data Ingestion") or 0
    aux = find_meter(all_items, "Auxiliary Logs Data Ingestion") or 0
    retention_int = find_meter(all_items, "Analytics Logs Data Retention") or 0
    search_q = find_meter(all_items, "Search Queries Scanned") or 0
    search_j = find_meter(all_items, "Search Jobs Scanned") or 0
    platform = find_meter(all_items, "Platform Logs Data Processed") or 0
    replication = find_meter(all_items, "Data Replication Data Replicated") or 0
    emission = find_meter(all_items, "Logs Emitted From Cloud Pipeline Data Emitted") or 0

    tiers = {}
    for gb in TIER_LEVELS:
        p = find_meter(all_items, f"{gb} GB Commitment Tier Capacity Reservation")
        if p is not None:
            tiers[str(gb)] = p

    return {
        "payg": payg, "basic": basic, "aux": aux,
        "retention_int": retention_int,
        "retention_lt": round(retention_int * 0.2, 4) if retention_int else 0.02,
        "search_q": search_q, "search_j": search_j,
        "platform": platform, "replication": replication, "emission": emission,
        "tiers": tiers,
    }


def main():
    results = {"_meta": {"fetched": str(date.today()), "api": API, "currency": "USD"}}
    for region in REGIONS:
        sys.stderr.write(f"Fetching {region}...\n")
        results[region] = fetch_region(region)

    json.dump(results, sys.stdout, indent=2)
    sys.stdout.write("\n")
    sys.stderr.write(f"\nDone. {len(REGIONS)} regions fetched on {date.today()}\n")


if __name__ == "__main__":
    main()
