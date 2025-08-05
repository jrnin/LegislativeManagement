#!/usr/bin/env python3
import csv
import psycopg2
import os
from datetime import datetime

# Database connection string
DATABASE_URL = os.environ.get('DATABASE_URL')

def parse_line(line):
    # Parse tab-separated values from PostgreSQL dump
    parts = line.strip().split('\t')
    if len(parts) >= 15:
        return {
            'id': int(parts[0]) if parts[0] != '\\N' else None,
            'document_number': int(parts[1]) if parts[1] != '\\N' else None,
            'document_type': parts[2] if parts[2] != '\\N' else None,
            'document_date': parts[3] if parts[3] != '\\N' else None,
            'author_type': parts[4] if parts[4] != '\\N' else None,
            'description': parts[5] if parts[5] != '\\N' else None,
            'file_path': parts[6] if parts[6] != '\\N' else None,
            'file_name': parts[7] if parts[7] != '\\N' else None,
            'file_type': parts[8] if parts[8] != '\\N' else None,
            'status': parts[9] if parts[9] != '\\N' else None,
            'activity_id': int(parts[10]) if parts[10] != '\\N' else None,
            'parent_document_id': int(parts[11]) if parts[11] != '\\N' else None,
            'created_at': parts[12] if parts[12] != '\\N' else None,
            'updated_at': parts[13] if parts[13] != '\\N' else None,
            'event_id': int(parts[14]) if parts[14] != '\\N' else None,
        }
    return None

def restore_documents():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Read the documents data
        with open('/tmp/documents_data.txt', 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        print(f"Found {len(lines)} document records to restore")
        
        # Insert each document
        for i, line in enumerate(lines):
            doc = parse_line(line)
            if doc:
                try:
                    cur.execute("""
                        INSERT INTO documents (
                            id, document_number, document_type, document_date, 
                            author_type, description, file_path, file_name, 
                            file_type, status, activity_id, parent_document_id, 
                            created_at, updated_at, event_id
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """, (
                        doc['id'], doc['document_number'], doc['document_type'], 
                        doc['document_date'], doc['author_type'], doc['description'], 
                        doc['file_path'], doc['file_name'], doc['file_type'], 
                        doc['status'], doc['activity_id'], doc['parent_document_id'], 
                        doc['created_at'], doc['updated_at'], doc['event_id']
                    ))
                    if (i + 1) % 10 == 0:
                        print(f"Restored {i + 1} documents...")
                except Exception as e:
                    print(f"Error inserting document {doc.get('id', 'unknown')}: {e}")
        
        # Update sequence
        cur.execute("SELECT setval('documents_id_seq', (SELECT MAX(id) FROM documents));")
        
        # Commit all changes
        conn.commit()
        
        # Get final count
        cur.execute("SELECT COUNT(*) FROM documents;")
        final_count = cur.fetchone()[0]
        
        print(f"✅ Successfully restored {final_count} documents!")
        
    except Exception as e:
        print(f"❌ Error during restoration: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    restore_documents()