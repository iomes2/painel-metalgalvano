import { FormService } from '../../services/formService';
import prisma from '../../config/database';
import { FormStatus } from '@prisma/client';

// Mock Prisma
jest.mock('../../config/database', () => ({
  form: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  photo: {
    createMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
  },
}));

// Mock Logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('FormService', () => {
  let formService: FormService;

  beforeEach(() => {
    formService = new FormService();
    jest.clearAllMocks();
  });

  describe('createForm', () => {
    it('should create a form successfully', async () => {
      const mockData = {
        formType: 'checklist',
        osNumber: '12345',
        data: { someField: 'value' },
        userId: 'user-123',
      };

      const mockCreatedForm = {
        id: 'form-123',
        ...mockData,
        status: FormStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.form.create as jest.Mock).mockResolvedValue(mockCreatedForm);

      const result = await formService.createForm(mockData);

      expect(prisma.form.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          formType: mockData.formType,
          osNumber: mockData.osNumber,
          userId: mockData.userId,
          status: FormStatus.DRAFT,
        }),
        include: expect.any(Object),
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedForm);
    });
  });

  describe('getFormById', () => {
    it('should return a form if found', async () => {
      const mockForm = { id: 'form-123', formType: 'checklist' };
      (prisma.form.findUnique as jest.Mock).mockResolvedValue(mockForm);

      const result = await formService.getFormById('form-123');
      expect(result).toEqual(mockForm);
    });

    it('should throw error if form not found', async () => {
      (prisma.form.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(formService.getFormById('non-existent')).rejects.toThrow('Formulário não encontrado');
    });
  });

  describe('listForms', () => {
    it('should return paginated forms', async () => {
      const mockForms = [{ id: 'form-1' }, { id: 'form-2' }];
      (prisma.form.findMany as jest.Mock).mockResolvedValue(mockForms);
      (prisma.form.count as jest.Mock).mockResolvedValue(2);

      const result = await formService.listForms({ page: 1, limit: 10 });

      expect(result.forms).toEqual(mockForms);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe('updateForm', () => {
    it('should update a form', async () => {
      const mockUpdatedForm = { id: 'form-1', formType: 'checklist' };
      (prisma.form.update as jest.Mock).mockResolvedValue(mockUpdatedForm);

      const result = await formService.updateForm('form-1', { formType: 'updated' }, 'user-1');
      expect(prisma.form.update).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedForm);
    });
  });

  describe('deleteForm', () => {
    it('should delete a form', async () => {
      (prisma.form.findUnique as jest.Mock).mockResolvedValue({ id: 'form-1' });
      (prisma.form.delete as jest.Mock).mockResolvedValue({ id: 'form-1' });

      await formService.deleteForm('form-1', 'user-1');
      expect(prisma.form.delete).toHaveBeenCalledWith({ where: { id: 'form-1' } });
    });
  });

  describe('submitForm', () => {
    it('should submit a form', async () => {
      const mockForm = { id: 'form-1', status: FormStatus.SUBMITTED };
      (prisma.form.update as jest.Mock).mockResolvedValue(mockForm);

      const result = await formService.submitForm('form-1', 'user-1');
      expect(result.status).toBe(FormStatus.SUBMITTED);
    });
  });

  describe('approveForm', () => {
    it('should approve a form', async () => {
      const mockForm = { id: 'form-1', status: FormStatus.APPROVED };
      (prisma.form.update as jest.Mock).mockResolvedValue(mockForm);

      const result = await formService.approveForm('form-1', 'user-1');
      expect(result.status).toBe(FormStatus.APPROVED);
    });
  });
});
