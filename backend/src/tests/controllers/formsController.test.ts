import { Request, Response } from 'express';
import * as formsController from '../../controllers/formsController';
import { FormService } from '../../services/formService';

// Mock dependencies
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
jest.mock('../../services/formService');
jest.mock('../../services/pdfService', () => ({
  generateReportPdf: jest.fn(),
}));
jest.mock('../../config/firebase', () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    set: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('firebase-admin', () => {
  const firestoreMock = {
    Timestamp: {
      fromMillis: jest.fn(),
    },
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    set: jest.fn().mockResolvedValue(undefined),
  };
  
  const firestoreFn = jest.fn(() => firestoreMock);
  (firestoreFn as any).Timestamp = { fromMillis: jest.fn() };

  return {
    apps: [],
    initializeApp: jest.fn(),
    credential: { cert: jest.fn() },
    auth: jest.fn(() => ({})),
    storage: jest.fn(() => ({})),
    firestore: firestoreFn,
  };
});

jest.mock('../../config/forms', () => ({
  getFormDefinition: jest.fn().mockReturnValue({ name: 'Test Form', fields: [] }),
}));

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('FormsController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { userId: 'user-123', email: 'test@example.com', role: 'admin' },
    } as any;
    jest.clearAllMocks();
  });

  describe('createForm', () => {
    it('should create a form and return 201', async () => {
      mockRequest.body = { formType: 'checklist', formData: {}, osNumber: '123' };
      const mockForm = { id: 'form-1', osNumber: '123' };
      
      (FormService.prototype.createForm as jest.Mock).mockResolvedValue(mockForm);

      const next = jest.fn();
      formsController.createForm(mockRequest as Request, mockResponse as Response, next);

      await wait(100);

      expect(next).not.toHaveBeenCalled();
      expect(FormService.prototype.createForm).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('listForms', () => {
    it('should list forms', async () => {
      const mockResult = { forms: [], pagination: {} };
      (FormService.prototype.listForms as jest.Mock).mockResolvedValue(mockResult);

      const next = jest.fn();
      formsController.listForms(mockRequest as Request, mockResponse as Response, next);

      await wait(50);

      expect(next).not.toHaveBeenCalled();
      expect(FormService.prototype.listForms).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [] }));
    });
  });

  describe('getFormById', () => {
    it('should return form details', async () => {
      mockRequest.params = { id: 'form-1' };
      const mockForm = { 
        id: 'form-1', 
        formType: 'checklist', 
        user: { email: 'test@test.com', name: 'Test' },
        photos: [],
        data: {}
      };
      (FormService.prototype.getFormById as jest.Mock).mockResolvedValue(mockForm);

      const next = jest.fn();
      formsController.getFormById(mockRequest as Request, mockResponse as Response, next);

      await wait(50);

      expect(next).not.toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
  describe('updateForm', () => {
    it('should update form', async () => {
      mockRequest.params = { id: 'form-1' };
      mockRequest.body = { formData: { field: 'value' } };
      const mockForm = { id: 'form-1' };
      (FormService.prototype.updateForm as jest.Mock).mockResolvedValue(mockForm);

      const next = jest.fn();
      formsController.updateForm(mockRequest as Request, mockResponse as Response, next);

      await wait(50);

      expect(next).not.toHaveBeenCalled();
      expect(FormService.prototype.updateForm).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('deleteForm', () => {
    it('should delete form', async () => {
      mockRequest.params = { id: 'form-1' };
      (FormService.prototype.deleteForm as jest.Mock).mockResolvedValue(undefined);

      const next = jest.fn();
      formsController.deleteForm(mockRequest as Request, mockResponse as Response, next);

      await wait(50);

      expect(next).not.toHaveBeenCalled();
      expect(FormService.prototype.deleteForm).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('submitForm', () => {
    it('should submit form', async () => {
      mockRequest.params = { id: 'form-1' };
      const mockForm = { id: 'form-1', status: 'SUBMITTED' };
      (FormService.prototype.submitForm as jest.Mock).mockResolvedValue(mockForm);

      const next = jest.fn();
      formsController.submitForm(mockRequest as Request, mockResponse as Response, next);

      await wait(50);

      expect(next).not.toHaveBeenCalled();
      expect(FormService.prototype.submitForm).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('approveForm', () => {
    it('should approve form', async () => {
      mockRequest.params = { id: 'form-1' };
      const mockForm = { id: 'form-1', status: 'APPROVED' };
      (FormService.prototype.approveForm as jest.Mock).mockResolvedValue(mockForm);

      const next = jest.fn();
      formsController.approveForm(mockRequest as Request, mockResponse as Response, next);

      await wait(50);

      expect(next).not.toHaveBeenCalled();
      expect(FormService.prototype.approveForm).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
