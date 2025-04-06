'use client';

import { useState, useEffect } from 'react';
import { User, Role } from '@prisma/client';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

interface UserWithOrderCount extends User {
  _count: {
    orders: number;
  };
}

interface PaginationData {
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithOrderCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "email">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [paginationData, setPaginationData] = useState<PaginationData>({
    total: 0,
    pages: 0,
    currentPage: 1,
    limit: 10,
  });
  const [editingUser, setEditingUser] = useState<UserWithOrderCount | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, selectedRole, sortBy, sortOrder, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole && { role: selectedRole }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }
      
      setUsers(data.users);
      setPaginationData({
        total: data.total,
        pages: data.pages,
        currentPage: data.currentPage,
        limit: data.limit,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to fetch users. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      toast.success('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update user');
      }
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as Role | "")}
          className="border p-2 rounded"
          aria-label="Filter by role"
          title="Filter users by role"
        >
          <option value="">All Roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "createdAt" | "name" | "email")}
          className="border p-2 rounded"
          aria-label="Sort by field"
          title="Sort users by field"
        >
          <option value="createdAt">Join Date</option>
          <option value="name">Name</option>
          <option value="email">Email</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="border p-2 rounded"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Role</th>
              <th className="border p-2">Orders</th>
              <th className="border p-2">Join Date</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border p-2">
                  {editingUser?.id === user.id ? (
                    <input
                      type="text"
                      value={editingUser.name || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="border p-1 w-full"
                    />
                  ) : (
                    user.name
                  )}
                </td>
                <td className="border p-2">
                  {editingUser?.id === user.id ? (
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="border p-1 w-full"
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td className="border p-2">
                  {editingUser?.id === user.id ? (
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                      className="border p-1"
                      aria-label="Select user role"
                      title="User role"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                <td className="border p-2">{user._count.orders}</td>
                <td className="border p-2">{formatDate(user.createdAt)}</td>
                <td className="border p-2">
                  {editingUser?.id === user.id ? (
                    <div className="flex gap-2">
                      {user.role !== 'ADMIN' ? (
                        <>
                          <button
                            onClick={() => handleUpdateUser(user.id, {
                              name: editingUser.name,
                              email: editingUser.email,
                              role: editingUser.role,
                            })}
                            className="bg-green-500 text-white px-2 py-1 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="bg-gray-500 text-white px-2 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <div className="text-red-500">Cannot edit admin account</div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => setEditingUser(user)}
                          className="bg-blue-500 text-white px-2 py-1 rounded"
                        >
                          Edit
                        </button>
                      )}
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div>
          Total: {paginationData.total} users
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="border p-2 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="p-2">
            Page {page} of {paginationData.pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === paginationData.pages}
            className="border p-2 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
} 