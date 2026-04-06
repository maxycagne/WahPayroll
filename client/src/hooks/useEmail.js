import emailjs from "@emailjs/browser";

export const useEmail = () => {
  const sendLeaveStatusEmail = async (item, status, message = "") => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const templateParams = {
      email: item.email,
      employee_name: `${item.first_name} ${item.last_name}`,
      leave_dates: `${item.date_from} to ${item.date_to}`,
      status: status,
      leave_type: item.leave_type,
      message: message,
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log("Email sent successfully!");
    } catch (error) {
      console.error("EmailJS Error:", error);
    }
  };

  return { sendLeaveStatusEmail };
};
