import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Space, Tag } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { workOrdersApi, carsApi, clientsApi, employeesApi } from '../api';
import dayjs from 'dayjs';

function WorkOrders() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [cars, setCars] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [workOrdersRes, carsRes, clientsRes, employeesRes] = await Promise.all([
        workOrdersApi.getAll(),
        carsApi.getAll(),
        clientsApi.getAll(),
        employeesApi.getAll(),
      ]);
      setWorkOrders(workOrdersRes.data);
      setCars(carsRes.data);
      setClients(clientsRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      // Generate bill number
      const billNumber = `WO-${Date.now()}`;
      
      const data = {
        bill_number: billNumber,
        car_id: values.car_id,
        client_id: values.client_id,
        employee_id: values.employee_id,
        start_datetime: values.start_datetime.format('YYYY-MM-DD HH:mm:ss'),
        notes: values.notes,
      };

      await workOrdersApi.create(data);
      message.success('Work order created successfully');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('Failed to create work order');
    }
  };

  const handleCarChange = (carId) => {
    const car = cars.find(c => c.id === carId);
    if (car) {
      form.setFieldsValue({ client_id: car.client_id });
    }
  };

  const columns = [
    {
      title: 'Bill #',
      dataIndex: 'bill_number',
      key: 'bill_number',
    },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
    },
    {
      title: 'Car',
      key: 'car',
      render: (_, record) => `${record.plate} - ${record.brand} ${record.model}`,
    },
    {
      title: 'Employee',
      dataIndex: 'employee_name',
      key: 'employee_name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : 'blue'}>
          {status === 'in_progress' ? 'In Progress' : 'Completed'}
        </Tag>
      ),
      filters: [
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Start Date',
      dataIndex: 'start_datetime',
      key: 'start_datetime',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => new Date(a.start_datetime) - new Date(b.start_datetime),
    },
    {
      title: 'Total Cost',
      dataIndex: 'total_cost',
      key: 'total_cost',
      render: (cost) => `$${cost?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/work-orders/${record.id}`)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Work Orders</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Create Work Order
        </Button>
      </div>

      <Table
        dataSource={workOrders}
        columns={columns}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="Create Work Order"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="car_id"
            label="Car"
            rules={[{ required: true, message: 'Please select a car' }]}
          >
            <Select
              showSearch
              placeholder="Select car"
              optionFilterProp="children"
              onChange={handleCarChange}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {cars.map((car) => (
                <Select.Option key={car.id} value={car.id}>
                  {car.plate} - {car.brand} {car.model} ({car.client_name})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="client_id"
            label="Client"
            rules={[{ required: true, message: 'Please select a client' }]}
          >
            <Select
              showSearch
              placeholder="Select client"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {clients.map((client) => (
                <Select.Option key={client.id} value={client.id}>
                  {client.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="employee_id"
            label="Assigned Employee"
            rules={[{ required: true, message: 'Please select an employee' }]}
          >
            <Select placeholder="Select employee">
              {employees.map((employee) => (
                <Select.Option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.role}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="start_datetime"
            label="Start Date & Time"
            rules={[{ required: true, message: 'Please select start date and time' }]}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default WorkOrders;
