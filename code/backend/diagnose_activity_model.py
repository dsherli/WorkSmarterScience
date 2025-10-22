import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from django.conf import settings
import psycopg2

print("=== Database Column Checker ===\n")

try:
    db_settings = settings.DATABASES['default']
    conn = psycopg2.connect(
        dbname=db_settings['NAME'],
        user=db_settings['USER'],
        password=db_settings['PASSWORD'],
        host=db_settings['HOST'],
        port=db_settings['PORT']
    )
    cursor = conn.cursor()
    
    # Get actual columns in the database
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'science_activity'
        ORDER BY ordinal_position
    """)
    
    db_columns = cursor.fetchall()
    
    print("ACTUAL DATABASE COLUMNS:")
    print("-" * 60)
    for col_name, data_type, nullable in db_columns:
        null_status = "NULL" if nullable == 'YES' else "NOT NULL"
        print(f"  {col_name:<30} {data_type:<20} {null_status}")
    
    print("\n" + "=" * 60)
    
    # Compare with Django model
    from activities.models import ScienceActivity
    model_fields = [f.name for f in ScienceActivity._meta.get_fields() if not f.many_to_many and not f.one_to_many]
    
    print("\nDJANGO MODEL FIELDS:")
    print("-" * 60)
    for field_name in model_fields:
        print(f"  {field_name}")
    
    print("\n" + "=" * 60)
    print("\nCOMPARISON:")
    print("-" * 60)
    
    db_column_names = [col[0] for col in db_columns]
    
    # Fields in model but not in database
    missing_in_db = [f for f in model_fields if f not in db_column_names and f != 'id']
    if missing_in_db:
        print("\n❌ Fields in MODEL but NOT in DATABASE:")
        for field in missing_in_db:
            print(f"   - {field}")
    
    # Fields in database but not in model
    missing_in_model = [col for col in db_column_names if col not in model_fields]
    if missing_in_model:
        print("\n⚠️  Fields in DATABASE but NOT in MODEL:")
        for field in missing_in_model:
            print(f"   - {field}")
    
    if not missing_in_db and not missing_in_model:
        print("\n✅ Model and database are in sync!")
    
    # Show sample data
    print("\n" + "=" * 60)
    print("\nSAMPLE DATA (first row):")
    print("-" * 60)
    cursor.execute("SELECT * FROM public.science_activity LIMIT 1")
    sample = cursor.fetchone()
    if sample:
        for col, val in zip(db_column_names, sample):
            val_str = str(val)[:50] if val else "NULL"
            print(f"  {col:<25} = {val_str}")
    else:
        print("  (No data in table)")
    
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("\n✅ Diagnosis complete!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
