import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from django.conf import settings
import psycopg2

print("=== Checking science_activity_images table ===\n")

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
    
    # Check if science_activity_images table exists
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'science_activity_images'
        ORDER BY ordinal_position
    """)
    
    columns = cursor.fetchall()
    
    if columns:
        print("✅ science_activity_images table found!")
        print("\nCOLUMNS:")
        print("-" * 60)
        for col_name, data_type, nullable in columns:
            null_status = "NULL" if nullable == 'YES' else "NOT NULL"
            print(f"  {col_name:<30} {data_type:<20} {null_status}")
        
        # Get sample data
        print("\n" + "=" * 60)
        print("\nSAMPLE DATA:")
        print("-" * 60)
        cursor.execute("SELECT * FROM public.science_activity_images LIMIT 3")
        rows = cursor.fetchall()
        col_names = [col[0] for col in columns]
        
        for i, row in enumerate(rows, 1):
            print(f"\nRow {i}:")
            for col, val in zip(col_names, row):
                val_str = str(val)[:80] if val else "NULL"
                print(f"  {col:<25} = {val_str}")
        
        # Check foreign key relationship
        print("\n" + "=" * 60)
        print("\nFOREIGN KEY RELATIONSHIPS:")
        print("-" * 60)
        cursor.execute("""
            SELECT
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = 'science_activity_images'
        """)
        
        fks = cursor.fetchall()
        if fks:
            for fk in fks:
                print(f"  {fk[0]} → {fk[1]}.{fk[2]}")
        else:
            print("  No foreign keys found (check for activity_id relationship)")
        
        # Check how many images per activity
        print("\n" + "=" * 60)
        print("\nIMAGES PER ACTIVITY:")
        print("-" * 60)
        cursor.execute("""
            SELECT activity_id, COUNT(*) as image_count
            FROM public.science_activity_images
            GROUP BY activity_id
            ORDER BY image_count DESC
            LIMIT 5
        """)
        
        img_counts = cursor.fetchall()
        for activity_id, count in img_counts:
            print(f"  {activity_id}: {count} image(s)")
    else:
        print("❌ science_activity_images table not found")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
