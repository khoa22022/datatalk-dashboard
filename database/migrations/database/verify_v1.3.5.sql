-- Datatalk v1.3.5 schema verification

select table_name, column_name, data_type
from information_schema.columns
where table_schema='public'
and table_name in (
 'users','projects','sessions','events','heatmap_events','feedback'
)
order by table_name, ordinal_position;