import emailjs from "@emailjs/browser";

export const useEmail = () => {
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const sendLeaveStatusEmail = async (item, status, message = "") => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const formattedStart = formatDate(item.date_from);
    const formattedEnd = formatDate(item.date_to);

    const templateParams = {
      email: item.email,
      employee_name: `${item.first_name} ${item.last_name}`,
      leave_dates: `${formattedStart} to ${formattedEnd}`,
      status: status,
      reason: item.reason || "No reason provided",
      leave_type: item.leave_type,
      message: message,
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log("Leave email sent successfully!");
    } catch (error) {
      console.error("EmailJS Error (Leave):", error);
    }
  };

  const sendResignationStatusEmail = async (item, status) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_RESIGNATION_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const templateParams = {
      email: item.recipient_email,

      employee_name: item.employee_name,
      position: item.position,
      date: formatDate(item.resignation_date),
      createddate: formatDate(item.created_at),
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log("Resignation email sent successfully!");
    } catch (error) {
      console.error("EmailJS Error (Resignation):", error.text || error);
    }
  };

  const sendImmediateResignationEmail = async (item) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_RESIGNATION_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const templateParams = {
      email: item.recipient_email,
      employee_name: item.employee_name,
      position: item.position,
      date: formatDate(item.resignation_date),
      createddate: formatDate(item.created_at),
      immediate_resignation: "IMMEDIATE RESIGNATION - HIGH PRIORITY",
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log("Immediate resignation email sent successfully!");
    } catch (error) {
      console.error("EmailJS Error (Immediate Resignation):", error.text || error);
    }
  };

  return { sendLeaveStatusEmail, sendResignationStatusEmail, sendImmediateResignationEmail };
};
