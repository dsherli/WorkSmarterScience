import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

print("Columns in science_activity table:")
print("-" * 40)
cur.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name='science_activity'
    ORDER BY ordinal_position
""")

for row in cur.fetchall():
    print(f"{row[0]:<30} {row[1]:<20} {'NULL' if row[2] == 'YES' else 'NOT NULL'}")

cur.close()
conn.close()
