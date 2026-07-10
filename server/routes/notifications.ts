import { Router } from "express";
import type { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import type { AuthenticatedRequest } from "../types.js";
import { requireAuth } from "../middleware/auth.js";

interface NotificationRecord {
  id: string;
  type: "expiration" | "workflow" | "info" | "alerte";
  priorite: "haute" | "normale" | "basse";
  titre: string;
  message: string;
  date: string;
  lue: boolean;
  lien?: string;
  referenceId?: string;
  arreteId?: string;
  userId: string;
  tenantId: string;
}

const router = Router();

// In-memory store (keyed by tenant + user for demo)
const notifications: NotificationRecord[] = [];

/**
 * GET /api/notifications
 * List all notifications for the current user.
 */
router.get("/", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id ?? "";
    const tenantId = req.tenantId ?? "";

    const userNotifications = notifications
      .filter((n) => n.userId === userId && n.tenantId === tenantId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      data: userNotifications.map(({ userId: _u, tenantId: _t, ...rest }) => rest),
      success: true,
    });
  } catch (err) {
    console.error("Erreur lors de la liste des notifications :", err);
    res.status(500).json({
      data: null,
      success: false,
      error: "Erreur interne du serveur",
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
router.patch(
  "/:id/read",
  requireAuth,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id ?? "";
      const notif = notifications.find(
        (n) => n.id === req.params.id && n.userId === userId,
      );

      if (!notif) {
        res.status(404).json({
          data: null,
          success: false,
          error: "Notification non trouvee",
        });
        return;
      }

      notif.lue = true;

      const { userId: _u, tenantId: _t, ...rest } = notif;
      res.json({
        data: rest,
        success: true,
      });
    } catch (err) {
      console.error(
        "Erreur lors du marquage de la notification comme lue :",
        err,
      );
      res.status(500).json({
        data: null,
        success: false,
        error: "Erreur interne du serveur",
      });
    }
  },
);

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user.
 */
router.post(
  "/mark-all-read",
  requireAuth,
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id ?? "";
      const tenantId = req.tenantId ?? "";

      let count = 0;
      for (const notif of notifications) {
        if (notif.userId === userId && notif.tenantId === tenantId && !notif.lue) {
          notif.lue = true;
          count++;
        }
      }

      res.json({
        data: { marquees: count },
        success: true,
      });
    } catch (err) {
      console.error(
        "Erreur lors du marquage de toutes les notifications :",
        err,
      );
      res.status(500).json({
        data: null,
        success: false,
        error: "Erreur interne du serveur",
      });
    }
  },
);

// Helper to seed a notification (used internally, not exposed as route)
export function creerNotification(
  params: Omit<NotificationRecord, "id">,
): NotificationRecord {
  const notif: NotificationRecord = {
    ...params,
    id: uuidv4(),
  };
  notifications.push(notif);
  return notif;
}

export default router;
