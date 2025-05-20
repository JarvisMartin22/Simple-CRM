-- This query identifies all array columns in the database
SELECT 
  table_name, 
  column_name, 
  data_type, 
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' AND
  (data_type LIKE '%array%' OR data_type LIKE '%ARRAY%')
ORDER BY 
  table_name, 
  column_name; 