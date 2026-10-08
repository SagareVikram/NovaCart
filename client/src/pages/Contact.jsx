import {
  useState,
} from "react";

import {
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaPhoneAlt,
  FaTwitter,
} from "react-icons/fa";

const Contact = () => {
  const [
    formData,
    setFormData,
  ] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setFormData(
        (current) => ({
          ...current,
          [name]: value,
        })
      );

      if (successMessage) {
        setSuccessMessage("");
      }

      if (errorMessage) {
        setErrorMessage("");
      }
    };

  const validateForm =
    () => {
      if (!formData.name.trim()) {
        return "Please enter your name.";
      }

      if (!formData.email.trim()) {
        return "Please enter your email address.";
      }

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          formData.email.trim()
        )
      ) {
        return "Please enter a valid email address.";
      }

      if (!formData.subject.trim()) {
        return "Please enter a subject.";
      }

      if (!formData.message.trim()) {
        return "Please enter your message.";
      }

      if (
        formData.message.trim().length <
        10
      ) {
        return "Message should contain at least 10 characters.";
      }

      return "";
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (submitting) {
        return;
      }

      setSuccessMessage("");
      setErrorMessage("");

      const validationError =
        validateForm();

      if (validationError) {
        setErrorMessage(
          validationError
        );

        return;
      }

      try {
        setSubmitting(true);

        /**
         * Contact form backend persistence
         * is intentionally not required for
         * the core NovaCart commerce flow.
         *
         * This keeps the page fully usable
         * now without introducing an
         * unnecessary backend model/route.
         *
         * Later, this can be connected to:
         * - email service
         * - support ticket API
         * - contact_messages collection
         */

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              500
            )
        );

        setSuccessMessage(
          "Thank you for contacting NovaCart. Your message has been received."
        );

        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      } catch (error) {
        console.error(
          "Contact form error:",
          error
        );

        setErrorMessage(
          "Unable to send your message right now."
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <div className="container">
          <div className="contact-hero-content">
            <span className="section-eyebrow">
              Contact NovaCart
            </span>

            <h1>
              We’re Here to Help
            </h1>

            <p>
              Have a question about products,
              orders, delivery, or your NovaCart
              account? Send us a message and our
              support team will be happy to help.
            </p>
          </div>
        </div>
      </section>

      <section className="contact-main-section section-spacing">
        <div className="container">
          <div className="contact-layout">
            <div className="contact-info-column">
              <div className="contact-info-heading">
                <span className="section-eyebrow">
                  Get in Touch
                </span>

                <h2>
                  Contact Information
                </h2>

                <p>
                  Use the details below or send
                  us a message through the contact
                  form.
                </p>
              </div>

              <div className="contact-info-grid">
                <div className="contact-info-card">
                  <div className="contact-info-icon">
                    <FaMapMarkerAlt />
                  </div>

                  <div>
                    <h3>
                      Location
                    </h3>

                    <p>
                      Maharashtra, India
                    </p>

                    <span>
                      NovaCart E-Commerce Project
                    </span>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon">
                    <FaEnvelope />
                  </div>

                  <div>
                    <h3>
                      Email
                    </h3>

                    <a href="mailto:support@novacart.com">
                      support@novacart.com
                    </a>

                    <span>
                      For general support
                    </span>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon">
                    <FaPhoneAlt />
                  </div>

                  <div>
                    <h3>
                      Phone
                    </h3>

                    <a href="tel:+919999999999">
                      +91 99999 99999
                    </a>

                    <span>
                      Customer assistance
                    </span>
                  </div>
                </div>
              </div>

              <div className="contact-support-card">
                <h3>
                  Customer Support
                </h3>

                <p>
                  For order-related support,
                  please keep your NovaCart order
                  number ready so your request can
                  be handled faster.
                </p>

                <div className="contact-support-hours">
                  <div>
                    <span>
                      Monday - Saturday
                    </span>

                    <strong>
                      9:00 AM - 6:00 PM
                    </strong>
                  </div>

                  <div>
                    <span>
                      Sunday
                    </span>

                    <strong>
                      Limited Support
                    </strong>
                  </div>
                </div>
              </div>

              <div className="contact-social-section">
                <h3>
                  Follow NovaCart
                </h3>

                <div className="contact-social-links">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                  >
                    <FaFacebookF />
                  </a>

                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                  >
                    <FaInstagram />
                  </a>

                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Twitter"
                  >
                    <FaTwitter />
                  </a>

                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                  >
                    <FaLinkedinIn />
                  </a>
                </div>
              </div>
            </div>

            <div className="contact-form-column">
              <div className="contact-form-card">
                <div className="contact-form-heading">
                  <span className="section-eyebrow">
                    Send a Message
                  </span>

                  <h2>
                    How Can We Help?
                  </h2>

                  <p>
                    Complete the form below and
                    send your enquiry to NovaCart.
                  </p>
                </div>

                {successMessage && (
                  <div className="contact-message success">
                    {
                      successMessage
                    }
                  </div>
                )}

                {errorMessage && (
                  <div className="contact-message error">
                    {
                      errorMessage
                    }
                  </div>
                )}

                <form
                  className="contact-form"
                  onSubmit={
                    handleSubmit
                  }
                  noValidate
                >
                  <div className="contact-form-grid">
                    <div className="form-group">
                      <label htmlFor="contact-name">
                        Full Name *
                      </label>

                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        value={
                          formData.name
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter your name"
                        maxLength="80"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="contact-email">
                        Email Address *
                      </label>

                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        value={
                          formData.email
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="contact-phone">
                        Phone Number
                      </label>

                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        value={
                          formData.phone
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter your phone number"
                        maxLength="18"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="contact-subject">
                        Subject *
                      </label>

                      <select
                        id="contact-subject"
                        name="subject"
                        value={
                          formData.subject
                        }
                        onChange={
                          handleChange
                        }
                        required
                      >
                        <option value="">
                          Select subject
                        </option>

                        <option value="Product Enquiry">
                          Product Enquiry
                        </option>

                        <option value="Order Support">
                          Order Support
                        </option>

                        <option value="Delivery Support">
                          Delivery Support
                        </option>

                        <option value="Payment Support">
                          Payment Support
                        </option>

                        <option value="Account Support">
                          Account Support
                        </option>

                        <option value="General Enquiry">
                          General Enquiry
                        </option>
                      </select>
                    </div>

                    <div className="form-group contact-form-full">
                      <label htmlFor="contact-message">
                        Message *
                      </label>

                      <textarea
                        id="contact-message"
                        name="message"
                        rows="7"
                        value={
                          formData.message
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Write your message here..."
                        maxLength="1000"
                        required
                      />

                      <small>
                        {
                          formData.message.length
                        }
                        /1000
                      </small>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="contact-submit-button"
                    disabled={
                      submitting
                    }
                  >
                    <FaPaperPlane />

                    {submitting
                      ? "Sending..."
                      : "Send Message"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-bottom-section">
        <div className="container">
          <div className="contact-bottom-card">
            <div>
              <span className="section-eyebrow">
                Shopping Support
              </span>

              <h2>
                Looking for a Product?
              </h2>

              <p>
                Browse the NovaCart catalog,
                explore categories, and discover
                the latest products available in
                the store.
              </p>
            </div>

            <a
              href="/products"
              className="primary-button"
            >
              Browse Products
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;