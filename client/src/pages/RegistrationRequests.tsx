import { RegistrationRequestsTable } from "@/features/RegistrationRequests/components/RegistrationRequestsTable";
import React from "react";

const RegistrationRequests = () => {
  return (
    <div className="max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Registration Requests
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and manage pending employee account registrations.
        </p>
      </div>
      <RegistrationRequestsTable />
    </div>
  );
};

export default RegistrationRequests;
