import { CloudServerOutlined, CloudSyncOutlined, LoadingOutlined } from '@ant-design/icons'
import DividerWithText from '@renderer/components/DividerWithText'
import { HStack } from '@renderer/components/Layout'
import ListItem from '@renderer/components/ListItem'
import BackupPopup from '@renderer/components/Popups/BackupPopup'
import RestorePopup from '@renderer/components/Popups/RestorePopup'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useKnowledgeFiles } from '@renderer/hooks/useKnowledgeFiles'
import { useTimer } from '@renderer/hooks/useTimer'
import ImportMenuOptions from '@renderer/pages/settings/DataSettings/ImportMenuSettings'
import { reset } from '@renderer/services/BackupService'
import store, { useAppDispatch } from '@renderer/store'
import { setSkipBackupFile as _setSkipBackupFile } from '@renderer/store/settings'
import type { AppInfo } from '@renderer/types'
import { formatFileSize } from '@renderer/utils'
import { occupiedDirs } from '@shared/config/constant'
import { Button, Progress, Switch, Tooltip, Typography } from 'antd'
import { FileText, FolderCog, FolderInput, FolderOpen, FolderOutput, SaveIcon } from 'lucide-react'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  SettingContainer,
  SettingDivider,
  SettingGroup,
  SettingHelpText,
  SettingRow,
  SettingRowTitle,
  SettingTitle
} from '..'
import ExportMenuOptions from './ExportMenuSettings'
import LocalBackupSettings from './LocalBackupSettings'
import MarkdownExportSettings from './MarkdownExportSettings'
import NotionSettings from './NotionSettings'
import ObsidianSettings from './ObsidianSettings'
import S3Settings from './S3Settings'
import WebDavSettings from './WebDavSettings'

const DataSettings: FC = () => {
  const { t } = useTranslation()
  const [appInfo, setAppInfo] = useState<AppInfo>()
  const [cacheSize, setCacheSize] = useState<string>('')
  const { size, removeAllFiles } = useKnowledgeFiles()
  const { theme } = useTheme()
  const [menu, setMenu] = useState<string>('data')
  const { setTimeoutTimer } = useTimer()

  const _skipBackupFile = store.getState().settings.skipBackupFile
  const [skipBackupFile, setSkipBackupFile] = useState<boolean>(_skipBackupFile)

  const dispatch = useAppDispatch()

  const menuItems = [
    { key: 'divider_0', isDivider: true, text: t('settings.data.divider.basic') },
    { key: 'data', title: t('settings.data.data.title'), icon: <FolderCog size={16} /> },
    { key: 'divider_1', isDivider: true, text: t('settings.data.divider.cloud_storage') },
    { key: 'local_backup', title: t('settings.data.local.title'), icon: <FolderCog size={16} /> },
    { key: 'webdav', title: t('settings.data.webdav.title'), icon: <CloudSyncOutlined style={{ fontSize: 16 }} /> },
    { key: 's3', title: t('settings.data.s3.title.label'), icon: <CloudServerOutlined style={{ fontSize: 16 }} /> },
    { key: 'divider_2', isDivider: true, text: t('settings.data.divider.import_settings') },
    {
      key: 'import_settings',
      title: t('settings.data.import_settings.title'),
      icon: <FolderOpen size={16} />
    },
    { key: 'divider_3', isDivider: true, text: t('settings.data.divider.export_settings') },
    {
      key: 'export_menu',
      title: t('settings.data.export_menu.title'),
      icon: <FolderInput size={16} />
    },
    {
      key: 'markdown_export',
      title: t('settings.data.markdown_export.title'),
      icon: <FileText size={16} />
    },

    { key: 'divider_4', isDivider: true, text: t('settings.data.divider.third_party') },
    { key: 'notion', title: t('settings.data.notion.title'), icon: <i className="iconfont icon-notion" /> },
    {
      key: 'obsidian',
      title: t('settings.data.obsidian.title'),
      icon: <i className="iconfont icon-obsidian" />
    }
  ]

  useEffect(() => {
    window.api.getAppInfo().then(setAppInfo)
    window.api.getCacheSize().then(setCacheSize)
  }, [])

  const handleOpenPath = (path?: string) => {
    if (!path) return
    if (path?.endsWith('log')) {
      const dirPath = path.split(/[/\\]/).slice(0, -1).join('/')
      window.api.openPath(dirPath)
    } else {
      window.api.openPath(path)
    }
  }

  const handleClearCache = () => {
    window.modal.confirm({
      title: t('settings.data.clear_cache.title'),
      content: t('settings.data.clear_cache.confirm'),
      okText: t('settings.data.clear_cache.button'),
      centered: true,
      okButtonProps: {
        danger: true
      },
      onOk: async () => {
        try {
          await window.api.clearCache()
          await window.api.trace.cleanLocalData()
          await window.api.getCacheSize().then(setCacheSize)
          window.toast.success(t('settings.data.clear_cache.success'))
        } catch (error) {
          window.toast.error(t('settings.data.clear_cache.error'))
        }
      }
    })
  }

  const handleRemoveAllFiles = () => {
    window.modal.confirm({
      centered: true,
      title: t('settings.data.app_knowledge.remove_all') + ` (${formatFileSize(size)}) `,
      content: t('settings.data.app_knowledge.remove_all_confirm'),
      onOk: async () => {
        await removeAllFiles()
        window.toast.success(t('settings.data.app_knowledge.remove_all_success'))
      },
      okText: t('common.delete'),
      okButtonProps: {
        danger: true
      }
    })
  }

  const handleSelectAppDataPath = async () => {
    if (!appInfo || !appInfo.appDataPath) {
      return
    }

    const newAppDataPath = await window.api.select({
      properties: ['openDirectory', 'createDirectory'],
      title: t('settings.data.app_data.select_title')
    })

    if (!newAppDataPath) {
      return
    }

    // check new app data path is root path
    // if is root path, show error
    const pathParts = newAppDataPath.split(/[/\\]/).filter((part: string) => part !== '')
    if (pathParts.length <= 1) {
      window.toast.error(t('settings.data.app_data.select_error_root_path'))
      return
    }

    // check new app data path is not in old app data path
    const isInOldPath = await window.api.isPathInside(newAppDataPath, appInfo.appDataPath)
    if (isInOldPath) {
      window.toast.error(t('settings.data.app_data.select_error_same_path'))
      return
    }

    // check new app data path is not in app install path
    const isInInstallPath = await window.api.isPathInside(newAppDataPath, appInfo.installPath)
    if (isInInstallPath) {
      window.toast.error(t('settings.data.app_data.select_error_in_app_path'))
      return
    }

    // check new app data path has write permission
    const hasWritePermission = await window.api.hasWritePermission(newAppDataPath)
    if (!hasWritePermission) {
      window.toast.error(t('settings.data.app_data.select_error_write_permission'))
      return
    }

    const migrationTitle = (
      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{t('settings.data.app_data.migration_title')}</div>
    )
    const migrationClassName = 'migration-modal'
    showMigrationConfirmModal(appInfo.appDataPath, newAppDataPath, migrationTitle, migrationClassName)
  }

  const doubleConfirmModalBeforeCopyData = (newPath: string) => {
    window.modal.confirm({
      title: t('settings.data.app_data.select_not_empty_dir'),
      content: t('settings.data.app_data.select_not_empty_dir_content'),
      centered: true,
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: () => {
        window.toast.info({
          title: t('settings.data.app_data.restart_notice'),
          timeout: 2000
        })
        setTimeoutTimer(
          'doubleConfirmModalBeforeCopyData',
          () => {
            window.api.relaunchApp({
              args: ['--new-data-path=' + newPath]
            })
          },
          500
        )
      }
    })
  }

  // 显示确认迁移的对话框
  const showMigrationConfirmModal = async (
    originalPath: string,
    newPath: string,
    title: React.ReactNode,
    className: string
  ) => {
    // 复制数据选项状态
    let shouldCopyData = !(await window.api.isNotEmptyDir(newPath))

    // 创建路径内容组件
    const PathsContent = () => (
      <div>
        <MigrationPathRow>
          <MigrationPathLabel>{t('settings.data.app_data.original_path')}:</MigrationPathLabel>
          <MigrationPathValue>{originalPath}</MigrationPathValue>
        </MigrationPathRow>
        <MigrationPathRow style={{ marginTop: '16px' }}>
          <MigrationPathLabel>{t('settings.data.app_data.new_path')}:</MigrationPathLabel>
          <MigrationPathValue>{newPath}</MigrationPathValue>
        </MigrationPathRow>
      </div>
    )

    const CopyDataContent = () => (
      <div>
        <MigrationPathRow style={{ marginTop: '20px', flexDirection: 'row', alignItems: 'center' }}>
          <Switch
            defaultChecked={shouldCopyData}
            onChange={(checked) => (shouldCopyData = checked)}
            style={{ marginRight: '8px' }}
            title={t('settings.data.app_data.copy_data_option')}
          />
          <MigrationPathLabel style={{ fontWeight: 'normal', fontSize: '14px' }}>
            {t('settings.data.app_data.copy_data_option')}
          </MigrationPathLabel>
        </MigrationPathRow>
      </div>
    )

    // 显示确认模态框
    window.modal.confirm({
      title,
      className,
      width: 'min(600px, 90vw)',
      style: { minHeight: '400px' },
      content: (
        <MigrationModalContent>
          <PathsContent />
          <CopyDataContent />
          <MigrationNotice>
            <p style={{ color: 'var(--color-warning)' }}>{t('settings.data.app_data.restart_notice')}</p>
            <p style={{ color: 'var(--color-text-3)', marginTop: '8px' }}>
              {t('settings.data.app_data.copy_time_notice')}
            </p>
          </MigrationNotice>
        </MigrationModalContent>
      ),
      centered: true,
      okButtonProps: {
        danger: true
      },
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          if (shouldCopyData) {
            if (await window.api.isNotEmptyDir(newPath)) {
              doubleConfirmModalBeforeCopyData(newPath)
              return
            }

            window.toast.info({
              title: t('settings.data.app_data.restart_notice'),
              timeout: 3000
            })
            setTimeoutTimer(
              'showMigrationConfirmModal_1',
              () => {
                window.api.relaunchApp({
                  args: ['--new-data-path=' + newPath]
                })
              },
              500
            )
            return
          }
          // 如果不复制数据，直接设置新的应用数据路径
          await window.api.setAppDataPath(newPath)
          window.toast.success(t('settings.data.app_data.path_changed_without_copy'))

          // 更新应用数据路径
          setAppInfo(await window.api.getAppInfo())

          // 通知用户并重启应用
          setTimeoutTimer(
            'showMigrationConfirmModal_2',
            () => {
              window.toast.success(t('settings.data.app_data.select_success'))
              window.api.setStopQuitApp(false, '')
              window.api.relaunchApp()
            },
            500
          )
        } catch (error) {
          window.api.setStopQuitApp(false, '')
          window.toast.error({
            title: t('settings.data.app_data.path_change_failed') + ': ' + error,
            timeout: 5000
          })
        }
      }
    })
  }

  useEffect(() => {
    const handleDataMigration = async () => {
      const newDataPath = await window.api.getDataPathFromArgs()
      if (!newDataPath) return

      const originalPath = (await window.api.getAppInfo())?.appDataPath
      if (!originalPath) return

      const title = (
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{t('settings.data.app_data.migration_title')}</div>
      )
      const className = 'migration-modal'

      // 显示进度模态框
      const showProgressModal = (title: React.ReactNode, className: string, PathsContent: React.FC) => {
        let currentProgress = 0
        let progressInterval: NodeJS.Timeout | null = null

        // 创建进度更新模态框
        const loadingModal = window.modal.info({
          title,
          className,
          width: 'min(600px, 90vw)',
          style: { minHeight: '400px' },
          icon: <LoadingOutlined style={{ fontSize: 18 }} />,
          content: (
            <MigrationModalContent>
              <PathsContent />
              <MigrationNotice>
                <p>{t('settings.data.app_data.copying')}</p>
                <div style={{ marginTop: '12px' }}>
                  <Progress percent={currentProgress} status="active" strokeWidth={8} />
                </div>
                <p style={{ color: 'var(--color-warning)', marginTop: '12px', fontSize: '13px' }}>
                  {t('settings.data.app_data.copying_warning')}
                </p>
              </MigrationNotice>
            </MigrationModalContent>
          ),
          centered: true,
          closable: false,
          maskClosable: false,
          okButtonProps: { style: { display: 'none' } }
        })

        // 更新进度的函数
        const updateProgress = (progress: number, status: 'active' | 'success' = 'active') => {
          loadingModal.update({
            title,
            content: (
              <MigrationModalContent>
                <PathsContent />
                <MigrationNotice>
                  <p>{t('settings.data.app_data.copying')}</p>
                  <div style={{ marginTop: '12px' }}>
                    <Progress percent={Math.round(progress)} status={status} strokeWidth={8} />
                  </div>
                  <p style={{ color: 'var(--color-warning)', marginTop: '12px', fontSize: '13px' }}>
                    {t('settings.data.app_data.copying_warning')}
                  </p>
                </MigrationNotice>
              </MigrationModalContent>
            )
          })
        }

        // 开始模拟进度更新
        progressInterval = setInterval(() => {
          if (currentProgress < 95) {
            currentProgress += Math.random() * 5 + 1
            if (currentProgress > 95) currentProgress = 95
            updateProgress(currentProgress)
          }
        }, 500)

        return { loadingModal, progressInterval, updateProgress }
      }

      // 开始迁移数据
      const startMigration = async (
        originalPath: string,
        newPath: string,
        progressInterval: NodeJS.Timeout | null,
        updateProgress: (progress: number, status?: 'active' | 'success') => void,
        loadingModal: { destroy: () => void }
      ): Promise<void> => {
        // flush app data
        await window.api.flushAppData()

        // wait 2 seconds to flush app data
        await new Promise((resolve) => setTimeoutTimer('startMigration_1', resolve, 2000))

        // 开始复制过程
        const copyResult = await window.api.copy(
          originalPath,
          newPath,
          occupiedDirs.map((dir) => originalPath + '/' + dir)
        )

        // 停止进度更新
        if (progressInterval) {
          clearInterval(progressInterval)
        }

        // 显示100%完成
        updateProgress(100, 'success')

        if (!copyResult.success) {
          // 延迟关闭加载模态框
          await new Promise<void>((resolve) => {
            setTimeoutTimer(
              'startMigration_2',
              () => {
                loadingModal.destroy()
                window.toast.error({
                  title: t('settings.data.app_data.copy_failed') + ': ' + copyResult.error,
                  timeout: 5000
                })
                resolve()
              },
              500
            )
          })

          throw new Error(copyResult.error || 'Unknown error during copy')
        }

        // 在复制成功后设置新的AppDataPath
        await window.api.setAppDataPath(newPath)

        // 短暂延迟以显示100%完成
        await new Promise((resolve) => setTimeoutTimer('startMigration_3', resolve, 500))

        // 关闭加载模态框
        loadingModal.destroy()

        window.toast.success({
          title: t('settings.data.app_data.copy_success'),
          timeout: 2000
        })
      }

      // Create PathsContent component for this specific migration
      const PathsContent = () => (
        <div>
          <MigrationPathRow>
            <MigrationPathLabel>{t('settings.data.app_data.original_path')}:</MigrationPathLabel>
            <MigrationPathValue>{originalPath}</MigrationPathValue>
          </MigrationPathRow>
          <MigrationPathRow style={{ marginTop: '16px' }}>
            <MigrationPathLabel>{t('settings.data.app_data.new_path')}:</MigrationPathLabel>
            <MigrationPathValue>{newDataPath}</MigrationPathValue>
          </MigrationPathRow>
        </div>
      )

      const { loadingModal, progressInterval, updateProgress } = showProgressModal(title, className, PathsContent)
      try {
        window.api.setStopQuitApp(true, t('settings.data.app_data.stop_quit_app_reason'))
        await startMigration(originalPath, newDataPath, progressInterval, updateProgress, loadingModal)

        // 更新应用数据路径
        setAppInfo(await window.api.getAppInfo())

        // 通知用户并重启应用
        setTimeoutTimer(
          'handleDataMigration',
          () => {
            window.toast.success(t('settings.data.app_data.select_success'))
            window.api.setStopQuitApp(false, '')
            window.api.relaunchApp({
              args: ['--user-data-dir=' + newDataPath]
            })
          },
          1000
        )
      } catch (error) {
        window.api.setStopQuitApp(false, '')
        window.toast.error({
          title: t('settings.data.app_data.copy_failed') + ': ' + error,
          timeout: 5000
        })
      } finally {
        if (progressInterval) {
          clearInterval(progressInterval)
        }
        loadingModal.destroy()
      }
    }

    handleDataMigration()
    // dont add others to deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSkipBackupFilesChange = (value: boolean) => {
    setSkipBackupFile(value)
    dispatch(_setSkipBackupFile(value))
  }

  return (
    <Container>
      <MenuList>
        {menuItems.map((item) =>
          item.isDivider ? (
            <DividerWithText key={item.key} text={item.text || ''} style={{ margin: '8px 0' }} /> // 动态传递分隔符文字
          ) : (
            <ListItem
              key={item.key}
              title={item.title}
              active={menu === item.key}
              onClick={() => setMenu(item.key)}
              titleStyle={{ fontWeight: 500 }}
              icon={item.icon}
            />
          )
        )}
      </MenuList>
      <SettingContainer theme={theme} style={{ display: 'flex', flex: 1, height: '100%' }}>
        {menu === 'data' && (
          <>
            <SettingGroup theme={theme}>
              <SettingTitle>{t('settings.data.title')}</SettingTitle>
              <SettingDivider />
              <SettingRow>
                <SettingRowTitle>{t('settings.general.backup.title')}</SettingRowTitle>
                <HStack gap="5px" justifyContent="space-between">
                  <Button onClick={BackupPopup.show} icon={<SaveIcon size={14} />}>
                    {t('settings.general.backup.button')}
                  </Button>
                  <Button onClick={RestorePopup.show} icon={<FolderOpen size={14} />}>
                    {t('settings.general.restore.button')}
                  </Button>
                </HStack>
              </SettingRow>
              <SettingDivider />
              <SettingRow>
                <SettingRowTitle>{t('settings.data.backup.skip_file_data_title')}</SettingRowTitle>
                <Switch checked={skipBackupFile} onChange={onSkipBackupFilesChange} />
              </SettingRow>
              <SettingRow>
                <SettingHelpText>{t('settings.data.backup.skip_file_data_help')}</SettingHelpText>
              </SettingRow>
              <SettingDivider />
            </SettingGroup>
            <SettingGroup theme={theme}>
              <SettingTitle>{t('settings.data.data.title')}</SettingTitle>
              <SettingDivider />
              <SettingRow>
                <SettingRowTitle>{t('settings.data.app_data.label')}</SettingRowTitle>
                <PathRow>
                  <PathText
                    style={{ color: 'var(--color-text-3)' }}
                    onClick={() => handleOpenPath(appInfo?.appDataPath)}>
                    {appInfo?.appDataPath}
                  </PathText>
                  <Tooltip title={t('settings.data.app_data.select')}>
                    <FolderOutput onClick={handleSelectAppDataPath} style={{ cursor: 'pointer' }} size={16} />
                  </Tooltip>
                  <HStack gap="5px" style={{ marginLeft: '8px' }}>
                    <Button onClick={() => handleOpenPath(appInfo?.appDataPath)}>
                      {t('settings.data.app_data.open')}
                    </Button>
                  </HStack>
                </PathRow>
              </SettingRow>
              <SettingDivider />
              <SettingRow>
                <SettingRowTitle>{t('settings.data.app_logs.label')}</SettingRowTitle>
                <PathRow>
                  <PathText style={{ color: 'var(--color-text-3)' }} onClick={() => handleOpenPath(appInfo?.logsPath)}>
                    {appInfo?.logsPath}
                  </PathText>
                  <HStack gap="5px" style={{ marginLeft: '8px' }}>
                    <Button onClick={() => handleOpenPath(appInfo?.logsPath)}>
                      {t('settings.data.app_logs.button')}
                    </Button>
                  </HStack>
                </PathRow>
              </SettingRow>
              <SettingDivider />
              <SettingRow>
                <SettingRowTitle>{t('settings.data.app_knowledge.label')}</SettingRowTitle>
                <HStack alignItems="center" gap="5px">
                  <Button onClick={handleRemoveAllFiles}>{t('settings.data.app_knowledge.button.delete')}</Button>
                </HStack>
              </SettingRow>
              <SettingDivider />
              <SettingRow>
                <SettingRowTitle>
                  {t('settings.data.clear_cache.title')}
                  {cacheSize && <CacheText>({cacheSize}MB)</CacheText>}
                </SettingRowTitle>
                <HStack gap="5px">
                  <Button onClick={handleClearCache}>{t('settings.data.clear_cache.button')}</Button>
                </HStack>
              </SettingRow>
              <SettingDivider />
              <SettingRow>
                <SettingRowTitle>{t('settings.general.reset.title')}</SettingRowTitle>
                <HStack gap="5px">
                  <Button onClick={reset} danger>
                    {t('settings.general.reset.title')}
                  </Button>
                </HStack>
              </SettingRow>
            </SettingGroup>
          </>
        )}
        {menu === 'webdav' && <WebDavSettings />}
        {menu === 's3' && <S3Settings />}
        {menu === 'import_settings' && <ImportMenuOptions />}
        {menu === 'export_menu' && <ExportMenuOptions />}
        {menu === 'markdown_export' && <MarkdownExportSettings />}
        {menu === 'notion' && <NotionSettings />}
        {menu === 'obsidian' && <ObsidianSettings />}
        {menu === 'local_backup' && <LocalBackupSettings />}
      </SettingContainer>
    </Container>
  )
}

const Container = styled(HStack)`
  flex: 1;
`

const MenuList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: var(--settings-width);
  padding: 12px;
  padding-bottom: 48px;
  border-right: 0.5px solid var(--color-border);
  height: 100vh;
  overflow: auto;
  box-sizing: border-box;
  min-height: 0;
  .iconfont {
    color: var(--color-text-2);
    line-height: 16px;
  }
`

const CacheText = styled(Typography.Text)`
  color: var(--color-text-3);
  font-size: 12px;
  margin-left: 5px;
  line-height: 16px;
  display: inline-block;
  vertical-align: middle;
  text-align: left;
`

const PathText = styled(Typography.Text)`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
  text-align: right;
  margin-left: 5px;
  cursor: pointer;
`

const PathRow = styled(HStack)`
  min-width: 0;
  flex: 1;
  width: 0;
  align-items: center;
  gap: 5px;
`

// Add styled components for migration modal
const MigrationModalContent = styled.div`
  padding: 20px 0 10px;
  display: flex;
  flex-direction: column;
`

const MigrationNotice = styled.div`
  margin-top: 24px;
  font-size: 14px;
`

const MigrationPathRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const MigrationPathLabel = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: var(--color-text-1);
`

const MigrationPathValue = styled.div`
  font-size: 14px;
  color: var(--color-text-2);
  background-color: var(--color-background-soft);
  padding: 8px 12px;
  border-radius: 4px;
  word-break: break-all;
  border: 1px solid var(--color-border);
`

export default DataSettings
