import { RegisterForm } from "@/features/Register";
import { Link } from "react-router-dom";
import React from "react";

const Register = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <img
          className="mx-auto h-20 w-auto"
          src="/images/wah-logo.png"
          alt="WAH Logo"
        />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Join the WAH Team
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-purple-600 hover:text-purple-500"
          >
            Log in here
          </Link>
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <RegisterForm />
      </div>

      <div className="mt-8 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Wireless Access for Health. All rights
        reserved.
      </div>
    </div>
  );
};

export default Register;
