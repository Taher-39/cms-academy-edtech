import { Request, Response } from "express";
import * as certificateService from "./certificate.service";

function handleError(res: Response, error: any, fallback = "সার্ভার ত্রুটি") {
  if (error?.status) return res.status(error.status).json({ message: error.message });
  console.error(error);
  return res.status(500).json({ message: fallback });
}

export async function claim(req: Request, res: Response) {
  try {
    const result = await certificateService.claimCertificate(
      req.user!.userId,
      req.params.courseId
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function listMine(req: Request, res: Response) {
  try {
    const result = await certificateService.listMyCertificates(req.user!.userId);
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function verify(req: Request, res: Response) {
  try {
    const result = await certificateService.verifyCertificate(req.params.certificateId);
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function listAll(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
    const result = await certificateService.listAllCertificates({ page, limit });
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}

export async function setRevoked(req: Request, res: Response) {
  try {
    const result = await certificateService.setRevoked(req.params.id, req.body?.revoked === true);
    return res.status(200).json(result);
  } catch (error: any) {
    return handleError(res, error);
  }
}
