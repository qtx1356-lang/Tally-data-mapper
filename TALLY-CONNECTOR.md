# EXFIN Tally Data Mapper — Phase 16: Universal Tally Connector

## 1. Overview & Architecture

The **Universal Tally Connector** provides a resilient, pluggable, and multi-version connectivity layer for connecting EXFIN to any running instance of **TallyPrime**, **Tally.ERP 9**, or network Tally installations.

### Core Architectural Flow
```
USER 
  ↓
TALLY CONNECTION (Profile Manager)
  ↓
VERSION DETECTION (TallyPrime 4.x / 3.x / ERP 9 / Legacy)
  ↓
PROTOCOL ADAPTER (TallyPrimeConnector / LegacyTallyConnector / MockConnector)
  ↓
REQUEST BUILDER (ITallyRequestBuilder with Read-Only Validation)
  ↓
RESPONSE RECEIVER (ITallyResponseReceiver with XXE Protection & Size Caps)
  ↓
PARSER (Robust XML / JSON Stream Parser)
  ↓
OBJECT NORMALIZER (ITallyObjectNormalizer with Source Lineage)
  ↓
SCHEMA INFERENCE ENGINE (Sample-based Variant & Relationship Detection)
  ↓
OUTPUT CATALOG
  ↓
PHASE 15 MAPPING & VISUAL QUERY BUILDER
```

---

## 2. Hard Security Constraints & Read-Only Enforcement

The application enforces a **100% Read-Only Policy** against Tally:

1. **Connector-Level Policy**:
   - `ReadOnlyMode = true` is hardcoded across all connector adapters.
   - The connector will never emit mutating requests to Tally.

2. **AST & Token Request Validator**:
   - Every request passes through `validateTallyReadOnly(payload)`.
   - Prohibited mutating tags (`<ALTER>`, `<CREATE>`, `<DELETE>`, `<MODIFY>`, `<IMPORT>`, `ACTION="CREATE"`, `ACTION="ALTER"`, etc.) are intercepted and rejected with `REQUEST_REJECTED`.
   - SQL write operations (`INSERT INTO`, `UPDATE`, `DELETE FROM`, `DROP`, `ALTER TABLE`) are blocked.

3. **XXE & External Entity Protections**:
   - XML parsing prohibits `<!DOCTYPE>` and `<!ENTITY>` definitions to prevent XML Entity Expansion or XML External Entity (XXE) vulnerabilities.

4. **Credential & Privacy Isolation**:
   - Passwords and sensitive portal tokens (`TOKEN`, `PASSWORD`, `SECRET`, `APIKEY`) are detected during schema inference and automatically masked in diagnostic logs and support packages.
   - Diagnostics packages (`.exfindiagnostics`) redact all IP addresses, company tax IDs, and financial figures.

---

## 3. Pluggable Adapters & Multi-Version Compatibility

| Tally Environment | Release Date | Adapter Used | Collections | Masters | Vouchers | GST Details | Custom TDL |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **TallyPrime 4.1** | 2024-03-15 | `TallyPrimeConnector` | Full | Full | Full | Full | Yes |
| **TallyPrime 4.0** | 2023-11-20 | `TallyPrimeConnector` | Full | Full | Full | Full | Yes |
| **TallyPrime 3.0 / 3.0.1** | 2023-06-10 | `TallyPrimeConnector` | Full | Full | Full | Full (Multi-GSTIN) | Yes |
| **TallyPrime 2.1 / 2.0** | 2022-04-05 | `TallyPrimeConnector` | Full | Full | Full | Full | Yes |
| **Tally.ERP 9 Rel 6.6.3** | 2020-07-13 | `LegacyTallyConnector` | Full | Full | Full | Full | Yes |
| **Tally.ERP 9 (Pre-GST 5.x)**| 2016-09-01 | `LegacyTallyConnector` | Full | Full | Full | None (VAT) | Partial |
| **Synthetic Sandbox** | Always Active| `MockTallyConnector` | Full | Full | Full | Full | Yes |

---

## 4. Capability Detection

Capabilities are verified dynamically through protocol handshakes:
- `canQueryCollections`: Native TDL collection reflection.
- `canReadLedgers`: Chart of accounts and groups.
- `canReadVouchers`: Transaction voucher entries.
- `canReadInventory`: Stock items, godowns, batches.
- `canReadGST`: Statutory GSTINs and tax rates.
- `canReadPayroll`: Salary & attendance records (marked inactive if F11 Payroll is disabled).
- `canReadCustomOutputs`: User-defined TDL fields and methods.

---

## 5. Schema Inference Engine

- **Bounded Record Sampling**: Evaluates up to 250 records per object to determine field types, nullability, and presence percentage.
- **Variant Type Detection**: Flags fields where records contain mixed alphanumeric and numeric representations (e.g. `Voucher.VOUCHERNUMBER`).
- **Deterministic Schema Signature**: Computes SHA-256 signature across discovered fields to detect company schema drift.
- **Relationship Inference**: Identifies foreign key linkages (`Voucher ➔ Ledger`, `Voucher ➔ StockItem`, `Ledger ➔ Group`) with Cartesian explosion safety guarantees.

---

## 6. API Reference

- `GET /api/connector/profiles`: List saved connection profiles.
- `POST /api/connector/profiles`: Create or update a profile.
- `POST /api/connector/profiles/set-active`: Select active profile.
- `POST /api/connector/test`: Execute live connection probe with latency & diagnostics.
- `GET /api/connector/capabilities`: Retrieve verified capability matrix.
- `GET /api/connector/health`: Check health status & response times.
- `POST /api/connector/validate-request`: Test harness for read-only compliance.
- `GET /api/connector/schema-inference`: Retrieve sample-inferred schema.
- `GET /api/connector/matrix`: Retrieve compatibility matrix.
- `GET /api/connector/logs`: Retrieve sanitized request audit logs.
- `POST /api/connector/debug-raw-mode`: Toggle debug raw mode with explicit operator consent.
- `GET /api/connector/support-package`: Download sanitized `.exfindiagnostics` JSON bundle.
