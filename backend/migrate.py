from app.database import engine
from sqlalchemy import text, inspect

inspector = inspect(engine)
cols = [c['name'] for c in inspector.get_columns('interviews')]
print('Current interviews columns:', cols)

if 'status' not in cols:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE interviews ADD COLUMN status VARCHAR"))
        conn.commit()
    print('SUCCESS: Added status column to interviews table')
else:
    print('OK: status column already exists — no changes needed')

# Verify
inspector2 = inspect(engine)
final_cols = [c['name'] for c in inspector2.get_columns('interviews')]
print('Final columns:', final_cols)
