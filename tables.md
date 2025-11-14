## Mitra's DB

### Admin Table Structure

Do check `./.schema` or [schema file](/.schema) for how it was really made

### Admin Table Structure

|cid|name              |type    |notnull|dflt_value       |pk |
|---|------------------|--------|-------|-----------------|---|
|0  |id                |INTEGER |0      |                 |1  |
|1  |username          |TEXT    |1      |                 |0  |
|2  |password          |TEXT    |1      |                 |0  |
|3  |recovery_code     |TEXT    |0      |                 |0  |
|4  |twoauth_activation|INTEGER |0      |                 |0  |
|5  |twoauth_code      |TEXT    |0      |                 |0  |
|6  |privilege         |TEXT    |1      |                 |0  |
|7  |date_of_enrollment|DATETIME|0      |CURRENT_TIMESTAMP|0  |
|8  |last_login_time   |DATETIME|0      |                 |0  |


### Benchmark/Test Table Structure

|cid|name     |type   |notnull|dflt_value|pk |
|---|---------|-------|-------|----------|---|
|0  |id       |INTEGER|0      |          |1  |
|1  |col_text1|TEXT   |0      |          |0  |
|2  |col_text2|TEXT   |0      |          |0  |
|3  |col_int1 |INTEGER|0      |          |0  |
|4  |col_int2 |INTEGER|0      |          |0  |
|5  |col_real1|REAL   |0      |          |0  |
|6  |col_real2|REAL   |0      |          |0  |
|7  |col_blob1|BLOB   |0      |          |0  |
|8  |col_date1|DATE   |0      |          |0  |
|9  |col_bool1|BOOLEAN|0      |          |0  |
