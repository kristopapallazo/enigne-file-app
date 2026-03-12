import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Space,
  Popconfirm,
  Tag,
  DatePicker,
  Select,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { workOrdersApi, servicesApi } from "../api";
import dayjs from "dayjs";

function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form] = Form.useForm();
  const [completeForm] = Form.useForm();

  const loadWorkOrder = useCallback(async () => {
    setLoading(true);
    try {
      const response = await workOrdersApi.getById(id);
      setWorkOrder(response.data);
      setServices(response.data.services || []);
    } catch (_error) {
      message.error("Failed to load work order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadWorkOrder();
  }, [loadWorkOrder]);

  const handleAddService = () => {
    setEditingService(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditService = (record) => {
    setEditingService(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await servicesApi.delete(serviceId);
      message.success("Service deleted successfully");
      loadWorkOrder();
    } catch (_error) {
      message.error("Failed to delete service");
    }
  };

  const handleServiceSubmit = async (values) => {
    try {
      const data = {
        ...values,
        work_order_id: parseInt(id),
      };

      if (editingService) {
        await servicesApi.update(editingService.id, {
          ...data,
          work_order_id: editingService.work_order_id,
        });
        message.success("Service updated successfully");
      } else {
        await servicesApi.create(data);
        message.success("Service added successfully");
      }
      setModalVisible(false);
      loadWorkOrder();
    } catch (_error) {
      message.error("Failed to save service");
    }
  };

  const handleComplete = () => {
    completeForm.setFieldsValue({
      end_datetime: dayjs(),
      status: "completed",
    });
    setCompleteModalVisible(true);
  };

  const handleCompleteSubmit = async (values) => {
    try {
      await workOrdersApi.update(id, {
        end_datetime: values.end_datetime.format("YYYY-MM-DD HH:mm:ss"),
        status: values.status,
        notes: values.notes || workOrder.notes,
        total_cost: workOrder.total_cost,
      });
      message.success("Work order completed successfully");
      setCompleteModalVisible(false);
      loadWorkOrder();
    } catch (_error) {
      message.error("Failed to complete work order");
    }
  };

  const serviceColumns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Unit Price",
      dataIndex: "unit_price",
      key: "unit_price",
      render: (price) => `$${parseFloat(price || 0).toFixed(2)}`,
    },
    {
      title: "Total",
      dataIndex: "total_price",
      key: "total_price",
      render: (price) => `$${parseFloat(price || 0).toFixed(2)}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditService(record)}
            disabled={workOrder?.status === "completed"}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this service?"
            onConfirm={() => handleDeleteService(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={workOrder?.status === "completed"}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={workOrder?.status === "completed"}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!workOrder) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/work-orders")}
        >
          Back to Work Orders
        </Button>
      </div>

      <Card
        title={`Work Order: ${workOrder.bill_number}`}
        extra={
          <Space>
            <Tag color={workOrder.status === "completed" ? "green" : "blue"}>
              {workOrder.status === "in_progress" ? "In Progress" : "Completed"}
            </Tag>
            {workOrder.status === "in_progress" && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleComplete}
              >
                Complete Work Order
              </Button>
            )}
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Client">
            {workOrder.client_name}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {workOrder.client_phone}
          </Descriptions.Item>
          <Descriptions.Item label="Car">
            {workOrder.plate} - {workOrder.brand} {workOrder.model}
          </Descriptions.Item>
          <Descriptions.Item label="Employee">
            {workOrder.employee_name}
          </Descriptions.Item>
          <Descriptions.Item label="Start Date">
            {dayjs(workOrder.start_datetime).format("DD/MM/YYYY HH:mm")}
          </Descriptions.Item>
          <Descriptions.Item label="End Date">
            {workOrder.end_datetime
              ? dayjs(workOrder.end_datetime).format("DD/MM/YYYY HH:mm")
              : "In Progress"}
          </Descriptions.Item>
          <Descriptions.Item label="Total Cost" span={2}>
            <span
              style={{ fontSize: "20px", fontWeight: "bold", color: "#1890ff" }}
            >
              ${parseFloat(workOrder.total_cost || 0).toFixed(2)}
            </span>
          </Descriptions.Item>
          {workOrder.notes && (
            <Descriptions.Item label="Notes" span={2}>
              {workOrder.notes}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card
        title="Services"
        style={{ marginTop: 24 }}
        extra={
          workOrder.status === "in_progress" && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddService}
            >
              Add Service
            </Button>
          )
        }
      >
        <Table
          dataSource={services}
          columns={serviceColumns}
          rowKey="id"
          loading={loading}
          pagination={false}
          summary={(pageData) => {
            const total = pageData.reduce(
              (sum, record) => sum + parseFloat(record.total_price || 0),
              0,
            );
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={3}>
                  <strong>Total</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell>
                  <strong>${total.toFixed(2)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell />
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      <Modal
        title={editingService ? "Edit Service" : "Add Service"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleServiceSubmit}>
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please enter service description" },
            ]}
          >
            <Input placeholder="Oil change, brake repair, etc." />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: "Please enter quantity" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="unit_price"
            label="Unit Price"
            rules={[{ required: true, message: "Please enter unit price" }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: "100%" }}
              prefix="$"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Complete Work Order"
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
        onOk={() => completeForm.submit()}
      >
        <Form
          form={completeForm}
          layout="vertical"
          onFinish={handleCompleteSubmit}
        >
          <Form.Item
            name="end_datetime"
            label="End Date & Time"
            rules={[
              { required: true, message: "Please select end date and time" },
            ]}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="in_progress">In Progress</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Additional Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default WorkOrderDetail;
