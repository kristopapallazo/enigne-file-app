import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { carsApi, clientsApi } from '../api';

function Cars() {
  const [cars, setCars] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadCars();
    loadClients();
  }, []);

  const loadCars = async () => {
    setLoading(true);
    try {
      const response = await carsApi.getAll();
      setCars(response.data);
    } catch (error) {
      message.error('Failed to load cars');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await clientsApi.getAll();
      setClients(response.data);
    } catch (error) {
      message.error('Failed to load clients');
    }
  };

  const handleSearch = async () => {
    if (!searchText) {
      loadCars();
      return;
    }
    setLoading(true);
    try {
      const response = await carsApi.search(searchText);
      setCars(response.data);
    } catch (error) {
      message.error('Failed to search cars');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCar(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCar(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await carsApi.delete(id);
      message.success('Car deleted successfully');
      loadCars();
    } catch (error) {
      message.error('Failed to delete car');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCar) {
        await carsApi.update(editingCar.id, values);
        message.success('Car updated successfully');
      } else {
        await carsApi.create(values);
        message.success('Car created successfully');
      }
      setModalVisible(false);
      loadCars();
    } catch (error) {
      message.error('Failed to save car');
    }
  };

  const columns = [
    {
      title: 'Plate',
      dataIndex: 'plate',
      key: 'plate',
      sorter: (a, b) => a.plate.localeCompare(b.plate),
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: 'Owner',
      dataIndex: 'client_name',
      key: 'client_name',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this car?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Cars</h2>
        <Space>
          <Input
            placeholder="Search by plate"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Button icon={<SearchOutlined />} onClick={handleSearch}>
            Search
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Car
          </Button>
        </Space>
      </div>

      <Table
        dataSource={cars}
        columns={columns}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingCar ? 'Edit Car' : 'Add Car'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="plate"
            label="Plate Number"
            rules={[{ required: true, message: 'Please enter plate number' }]}
          >
            <Input placeholder="ABC123" />
          </Form.Item>
          <Form.Item
            name="brand"
            label="Brand"
            rules={[{ required: true, message: 'Please enter brand' }]}
          >
            <Input placeholder="Toyota" />
          </Form.Item>
          <Form.Item
            name="model"
            label="Model"
            rules={[{ required: true, message: 'Please enter model' }]}
          >
            <Input placeholder="Corolla" />
          </Form.Item>
          <Form.Item name="year" label="Year">
            <InputNumber min={1900} max={new Date().getFullYear() + 1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="client_id"
            label="Owner"
            rules={[{ required: true, message: 'Please select owner' }]}
          >
            <Select
              showSearch
              placeholder="Select owner"
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
        </Form>
      </Modal>
    </div>
  );
}

export default Cars;
