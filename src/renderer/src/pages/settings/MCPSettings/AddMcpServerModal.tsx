import { loggerService } from '@logger'
import { nanoid } from '@reduxjs/toolkit'
import CodeEditor from '@renderer/components/CodeEditor'
import { useAppDispatch } from '@renderer/store'
import { setMCPServerActive } from '@renderer/store/mcp'
import type { MCPServer } from '@renderer/types'
import { objectKeys, safeValidateMcpConfig } from '@renderer/types'
import { parseJSON } from '@renderer/utils'
import { formatZodError } from '@renderer/utils/error'
import { Form, Modal } from 'antd'
import type { FC } from 'react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

const logger = loggerService.withContext('AddMcpServerModal')

interface AddMcpServerModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: (server: MCPServer) => void
  existingServers: MCPServer[]
}

interface ParsedServerData extends MCPServer {
  url?: string // JSON 可能包含此欄位，而不是 baseUrl
}

// 預設的 JSON 範例內容
const initialJsonExample = `// Example JSON (stdio):
// {
//   "mcpServers": {
//     "stdio-server-example": {
//       "command": "npx",
//       "args": ["-y", "mcp-server-example"]
//     }
//   }
// }

// Example JSON (sse):
// {
//   "mcpServers": {
//     "sse-server-example": {
//       "type": "sse",
//       "url": "http://localhost:3000"
//     }
//   }
// }

// Example JSON (streamableHttp):
// {
//   "mcpServers": {
//     "streamable-http-example": {
//       "type": "streamableHttp",
//       "url": "http://localhost:3001",
//       "headers": {
//         "Content-Type": "application/json",
//         "Authorization": "Bearer your-token"
//       }
//     }
//   }
// }
`

const AddMcpServerModal: FC<AddMcpServerModalProps> = ({
  visible,
  onClose,
  onSuccess,
  existingServers
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const dispatch = useAppDispatch()

  /**
   * 从JSON字符串中解析MCP服务器配置
   * @param inputValue - JSON格式的服务器配置字符串
   * @returns 包含解析后的服务器配置和可能的错误信息的对象
   * - serverToAdd: 解析成功时返回服务器配置对象，失败时返回null
   * - error: 解析失败时返回错误信息，成功时返回null
   */
  const getServerFromJson = (
    inputValue: string
  ): { serverToAdd: Partial<ParsedServerData>; error: null } | { serverToAdd: null; error: string } => {
    const trimmedInput = inputValue.trim()
    const parsedJson = parseJSON(trimmedInput)
    if (parsedJson === null) {
      logger.error('Failed to parse json.', { input: trimmedInput })
      return { serverToAdd: null, error: t('settings.mcp.addServer.importFrom.invalid') }
    }

    const { data: validConfig, error } = safeValidateMcpConfig(parsedJson)
    if (error) {
      logger.error('Failed to validate json.', { parsedJson, error })
      return { serverToAdd: null, error: formatZodError(error, t('settings.mcp.addServer.importFrom.invalid')) }
    }

    let serverToAdd: Partial<ParsedServerData> | null = null

    if (objectKeys(validConfig.mcpServers).length > 1) {
      return { serverToAdd: null, error: t('settings.mcp.addServer.importFrom.error.multipleServers') }
    }

    if (objectKeys(validConfig.mcpServers).length > 0) {
      const key = objectKeys(validConfig.mcpServers)[0]
      serverToAdd = validConfig.mcpServers[key]
      if (!serverToAdd.name) {
        serverToAdd.name = key
      }
    } else {
      return { serverToAdd: null, error: t('settings.mcp.addServer.importFrom.invalid') }
    }

    // zod 太好用了你们知道吗
    return { serverToAdd, error: null }
  }

  const handleOk = async () => {
    try {
      setLoading(true)

      const values = await form.validateFields()
      const inputValue = values.serverConfig.trim()

      const { serverToAdd, error } = getServerFromJson(inputValue)

      if (error !== null) {
        form.setFields([
          {
            name: 'serverConfig',
            errors: [error]
          }
        ])
        setLoading(false)
        return
      }

      // 檢查重複名稱
      if (existingServers && existingServers.some((server) => server.name === serverToAdd.name)) {
        form.setFields([
          {
            name: 'serverConfig',
            errors: [t('settings.mcp.addServer.importFrom.nameExists', { name: serverToAdd.name })]
          }
        ])
        setLoading(false)
        return
      }

      // 如果成功解析並通過所有檢查，立即加入伺服器（非啟用狀態）並關閉對話框
      const installTimestamp = Date.now()
      const newServer: MCPServer = {
        id: nanoid(),
        ...serverToAdd,
        name: serverToAdd.name || t('settings.mcp.newServer'),
        baseUrl: serverToAdd.baseUrl ?? serverToAdd.url ?? '',
        isActive: false, // 初始狀態為非啟用
        installSource: 'manual',
        isTrusted: true,
        installedAt: installTimestamp,
        trustedAt: installTimestamp
      }

      onSuccess(newServer)
      form.resetFields()
      onClose()

      // 在背景非同步檢查伺服器可用性並更新狀態
      window.api.mcp
        .checkMcpConnectivity(newServer)
        .then((isConnected) => {
          logger.debug(`Connectivity check for ${newServer.name}: ${isConnected}`)
          dispatch(setMCPServerActive({ id: newServer.id, isActive: isConnected }))
        })
        .catch((connError: any) => {
          logger.error(`Connectivity check failed for ${newServer.name}:`, connError)
          window.toast.error(newServer.name + t('settings.mcp.addServer.importFrom.connectionFailed'))
        })
    } finally {
      setLoading(false)
    }
  }

  // CodeEditor 內容變更時的回呼函式
  const handleEditorChange = useCallback(
    (newContent: string) => {
      form.setFieldsValue({ serverConfig: newContent })
      // 可選：如果希望即時驗證，可以取消註解下一行
      // form.validateFields(['serverConfig']);
    },
    [form]
  )

  const serverConfigValue = form.getFieldValue('serverConfig')

  return (
    <Modal
      title={t('settings.mcp.addServer.importFrom.json')}
      open={visible}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields()
        onClose()
      }}
      confirmLoading={loading}
      destroyOnHidden
      centered
      transitionName="animation-move-down"
      width={600}>
      <Form form={form} layout="vertical" name="add_mcp_server_form">
        <Form.Item
          name="serverConfig"
          label={t('settings.mcp.addServer.importFrom.tooltip')}
          rules={[{ required: true, message: t('settings.mcp.addServer.importFrom.placeholder') }]}>
          <CodeEditor
            value={serverConfigValue}
            placeholder={initialJsonExample}
            language="json"
            onChange={handleEditorChange}
            height="60vh"
            expanded={false}
            wrapped
            options={{
              lint: true,
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              keymap: true
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AddMcpServerModal
