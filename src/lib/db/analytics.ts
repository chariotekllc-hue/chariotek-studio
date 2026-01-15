/**
 * Analytics and Metrics Utilities
 * 
 * Provides database-level analytics for the CMS.
 */

import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  getCountFromServer
} from 'firebase/firestore';
import { firestore } from '@/firebase/index';

// =============================================================================
// TYPES
// =============================================================================

export interface DashboardStats {
  totalAdmins: number;
  activeAdmins: number;
  totalAuditLogs: number;
  recentEdits: number;
  contactSubmissions: number;
  unreadSubmissions: number;
}

export interface RecentActivity {
  action: string;
  userEmail: string;
  resourceType: string;
  resourceId: string;
  timestamp: number;
  success: boolean;
}

export interface ContentStats {
  collection: string;
  documentCount: number;
  lastUpdated?: number;
}

// =============================================================================
// ANALYTICS FUNCTIONS
// =============================================================================

/**
 * Get dashboard statistics for the admin panel
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const stats: DashboardStats = {
    totalAdmins: 0,
    activeAdmins: 0,
    totalAuditLogs: 0,
    recentEdits: 0,
    contactSubmissions: 0,
    unreadSubmissions: 0
  };

  try {
    // Count total admins
    const adminsSnapshot = await getCountFromServer(
      collection(firestore, 'adminUsers')
    );
    stats.totalAdmins = adminsSnapshot.data().count;

    // Count active admins
    const activeAdminsQuery = query(
      collection(firestore, 'adminUsers'),
      where('isActive', '==', true)
    );
    const activeSnapshot = await getCountFromServer(activeAdminsQuery);
    stats.activeAdmins = activeSnapshot.data().count;

    // Count audit logs (total)
    const auditSnapshot = await getCountFromServer(
      collection(firestore, 'audit_logs')
    );
    stats.totalAuditLogs = auditSnapshot.data().count;

    // Count recent edits (last 24 hours)
    const yesterday = Date.now() - (24 * 60 * 60 * 1000);
    const recentEditsQuery = query(
      collection(firestore, 'audit_logs'),
      where('timestamp', '>=', yesterday),
      where('action', 'in', ['create', 'update'])
    );
    const recentEditsSnapshot = await getCountFromServer(recentEditsQuery);
    stats.recentEdits = recentEditsSnapshot.data().count;

    // Count contact submissions
    const contactsSnapshot = await getCountFromServer(
      collection(firestore, 'contact_submissions')
    );
    stats.contactSubmissions = contactsSnapshot.data().count;

    // Count unread submissions
    const unreadQuery = query(
      collection(firestore, 'contact_submissions'),
      where('isRead', '==', false)
    );
    const unreadSnapshot = await getCountFromServer(unreadQuery);
    stats.unreadSubmissions = unreadSnapshot.data().count;

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }

  return stats;
}

/**
 * Get recent admin activity
 * 
 * @param limitCount - Maximum number of activities to return
 */
export async function getRecentActivity(
  limitCount = 10
): Promise<RecentActivity[]> {
  try {
    const q = query(
      collection(firestore, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        action: data.action,
        userEmail: data.userEmail,
        resourceType: data.resourceType || 'unknown',
        resourceId: data.resourceId || '',
        timestamp: data.timestamp,
        success: data.success !== false
      };
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

/**
 * Get content collection statistics
 */
export async function getContentStats(): Promise<ContentStats[]> {
  const collections = [
    'sites',
    'homes',
    'domains',
    'about',
    'about_values',
    'legals',
    'services_page',
    'service_categories',
    'portfolio_projects',
    'training',
    'tools',
    'consulting',
    'enterprise_training'
  ];

  const stats: ContentStats[] = [];

  for (const collectionName of collections) {
    try {
      const snapshot = await getCountFromServer(
        collection(firestore, collectionName)
      );
      
      stats.push({
        collection: collectionName,
        documentCount: snapshot.data().count
      });
    } catch (error) {
      // Collection might not exist yet
      stats.push({
        collection: collectionName,
        documentCount: 0
      });
    }
  }

  return stats;
}

/**
 * Get activity breakdown by action type for a date range
 */
export async function getActivityBreakdown(
  startDate: number,
  endDate: number
): Promise<Record<string, number>> {
  const q = query(
    collection(firestore, 'audit_logs'),
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate)
  );

  const snapshot = await getDocs(q);
  const breakdown: Record<string, number> = {};

  snapshot.docs.forEach(doc => {
    const action = doc.data().action || 'unknown';
    breakdown[action] = (breakdown[action] || 0) + 1;
  });

  return breakdown;
}

/**
 * Get top active admins for a date range
 */
export async function getTopActiveAdmins(
  startDate: number,
  endDate: number,
  limitCount = 5
): Promise<Array<{ email: string; actionCount: number }>> {
  const q = query(
    collection(firestore, 'audit_logs'),
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate)
  );

  const snapshot = await getDocs(q);
  const adminCounts: Record<string, number> = {};

  snapshot.docs.forEach(doc => {
    const email = doc.data().userEmail || 'unknown';
    adminCounts[email] = (adminCounts[email] || 0) + 1;
  });

  // Sort and limit
  return Object.entries(adminCounts)
    .map(([email, actionCount]) => ({ email, actionCount }))
    .sort((a, b) => b.actionCount - a.actionCount)
    .slice(0, limitCount);
}
