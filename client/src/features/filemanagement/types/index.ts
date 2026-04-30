export interface Employee {
  emp_id: string;
  first_name?: string;
  last_name?: string;
  employee_name?: string;
  display_name?: string;
  position?: string;
  designation?: string;
  role: string;
  is_archived?: boolean;
}

export interface FileDocument {
  id: string | number;
  emp_id: string;
  employee_name?: string;
  file_type: string;
  file_name?: string;
  file_key?: string;
  uploaded_at: string;
  source: string;
  position?: string;
  designation?: string;
  request_type?: string;
  request_status?: string;
  application_id?: string | number;
  record_id?: string | number;
  file_status?: string;
  replaceable?: boolean;
  file_field?: string;
  download_url?: string;
  template_type?: string;
  document_data?: any;
  is_archived?: boolean;
}

export interface FileTemplate {
  id: string | number;
  title: string;
  category?: string;
  original_name?: string;
  created_at: string;
  is_archived?: boolean;
}

export interface FileInventory {
  employees: Employee[];
  files: FileDocument[];
}
