import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Card, Alert, Typography } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";

const { Title } = Typography;

function Signup() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await signup({
        garageName: values.garageName,
        garageEmail: values.garageEmail,
        garagePhone: values.garagePhone || "",
        garageAddress: values.garageAddress || "",
        userName: values.userName,
        userEmail: values.userEmail,
        password: values.password,
      });

      if (result.success) {
        setSuccess(true);
        navigate("/");
      } else {
        setError(result.error);
      }
    } catch (_err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <Card
        style={{
          width: 500,
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🚗</div>
          <Title level={2} style={{ margin: 0 }}>
            Garage Management
          </Title>
          <p style={{ color: "#666", marginTop: 8 }}>Create a new account</p>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {success && (
          <Alert
            message="Registration successful! Redirecting..."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          name="signup"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
            Garage Information
          </Title>

          <Form.Item
            name="garageName"
            rules={[{ required: true, message: "Please input garage name" }]}
          >
            <Input prefix={<HomeOutlined />} placeholder="Garage Name" />
          </Form.Item>

          <Form.Item
            name="garageEmail"
            rules={[
              { required: true, message: "Please input garage email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Garage Email" />
          </Form.Item>

          <Form.Item
            name="garagePhone"
            rules={[{ message: "Please enter a valid phone number" }]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Garage Phone (Optional)"
            />
          </Form.Item>

          <Form.Item name="garageAddress" rules={[]}>
            <Input.TextArea placeholder="Garage Address (Optional)" rows={2} />
          </Form.Item>

          <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
            Admin User Information
          </Title>

          <Form.Item
            name="userName"
            rules={[{ required: true, message: "Please input your name" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Full Name" />
          </Form.Item>

          <Form.Item
            name="userEmail"
            rules={[
              { required: true, message: "Please input your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Please input your password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 40 }}
            >
              Sign Up
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <span style={{ color: "#666" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#667eea" }}>
                Sign In
              </Link>
            </span>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default Signup;
