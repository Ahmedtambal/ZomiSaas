-- Fix Nationality Field Type in Forms
-- Changes nationality field from type 'text' to 'searchable-select' with proper options
-- This allows users to search and select from a predefined list of nationalities

DO $$ 
DECLARE
    form_record RECORD;
    updated_form_data jsonb;
    field_index integer;
BEGIN
    -- Loop through all forms
    FOR form_record IN 
        SELECT id, form_data 
        FROM forms 
        WHERE form_data->'fields' IS NOT NULL
    LOOP
        updated_form_data := form_record.form_data;
        
        -- Find the nationality field in the fields array
        FOR field_index IN 0..(jsonb_array_length(updated_form_data->'fields') - 1)
        LOOP
            IF updated_form_data->'fields'->field_index->>'name' = 'nationality' THEN
                -- Update the nationality field to searchable-select type
                updated_form_data := jsonb_set(
                    updated_form_data,
                    array['fields', field_index::text, 'type'],
                    '"searchable-select"'::jsonb
                );
                
                -- Add options array with common nationalities
                updated_form_data := jsonb_set(
                    updated_form_data,
                    array['fields', field_index::text, 'options'],
                    '["British", "Irish", "Other EU", "American", "Canadian", "Australian", "Indian", "Pakistani", "Bangladeshi", "Chinese", "Filipino", "Nigerian", "South African", "Other"]'::jsonb
                );
                
                RAISE NOTICE 'Updated nationality field in form %', form_record.id;
            END IF;
        END LOOP;
        
        -- Update the form record if any changes were made
        IF updated_form_data != form_record.form_data THEN
            UPDATE forms 
            SET form_data = updated_form_data,
                updated_at = NOW()
            WHERE id = form_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Nationality field type update complete';
END $$;
