import * as XLSX from 'xlsx'
import type { User } from '../types'

// 导出用户数据到Excel
export function exportUsersToExcel(users: User[], filename = '用户列表') {
  // 转换数据格式
  const data = users.map(user => ({
    'ID': user.id,
    '用户名': user.username,
    '姓名': user.full_name || '-',
    '邮箱': user.email || '-',
    '手机号': user.phone || '-',
    '状态': user.active ? '激活' : '禁用',
    '角色': user.roles ? user.roles.join(', ') : '-',
    '创建时间': user.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '-',
    '更新时间': user.updated_at ? new Date(user.updated_at).toLocaleString('zh-CN') : '-'
  }))

  // 创建工作簿
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '用户列表')

  // 设置列宽
  const colWidths = [
    { wch: 8 },   // ID
    { wch: 15 },  // 用户名
    { wch: 12 },  // 姓名
    { wch: 20 },  // 邮箱
    { wch: 15 },  // 手机号
    { wch: 8 },   // 状态
    { wch: 20 },  // 角色
    { wch: 20 },  // 创建时间
    { wch: 20 }   // 更新时间
  ]
  ws['!cols'] = colWidths

  // 下载文件
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
  XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`)
}

// 导出用户数据到CSV
export function exportUsersToCSV(users: User[], filename = '用户列表') {
  // 转换数据格式
  const headers = ['ID', '用户名', '姓名', '邮箱', '手机号', '状态', '角色', '创建时间', '更新时间']
  const data = users.map(user => [
    user.id,
    user.username,
    user.full_name || '-',
    user.email || '-',
    user.phone || '-',
    user.active ? '激活' : '禁用',
    user.roles ? user.roles.join(', ') : '-',
    user.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '-',
    user.updated_at ? new Date(user.updated_at).toLocaleString('zh-CN') : '-'
  ])

  // 创建CSV内容
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  // 创建BOM以支持中文
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  // 下载文件
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
  link.setAttribute('download', `${filename}_${timestamp}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
