# [https://www.openexpense.org](https://www.openexpense.org)

**A privacy-first, offline-only financial management tool.**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen)

## Overview
**OpenExpense** is a lightweight, local-first expense tracker designed for those who value data sovereignty. Unlike standard platforms that rely on cloud synchronization and data mining, OpenExpense runs entirely on your local machine. Your financial history never leaves your browser.

## Features
* **Zero-Server Architecture:** No backend, no databases, and no API calls to third-party servers.
* **Privacy by Design:** Your data resides strictly in your browser's memory. It is immune to data breaches or corporate profiling.
* **Open Source:** Full transparency. Audit the code and modify it to suit your needs.
* **Local Persistence:** Easily export your ledger as a JSON file to maintain your own long-term records.

## Data Architecture
OpenExpense uses a dictionary-based structure to map calendar dates to expense records. 

```json
{
  "events": {
    "2026-06-03": [
      { 
        "title": "API Hosting", 
        "price": 49.99, 
        "recurring": true 
      }
    ]
  }
}
