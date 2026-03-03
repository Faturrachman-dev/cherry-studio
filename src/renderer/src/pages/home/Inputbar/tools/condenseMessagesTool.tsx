import { ActionIconButton } from '@renderer/components/Buttons'
import { QuickPanelReservedSymbol } from '@renderer/components/QuickPanel'
import { defineTool, registerTool, TopicType } from '@renderer/pages/home/Inputbar/types'
import { EventEmitter, EVENT_NAMES } from '@renderer/services/EventService'
import { Tooltip } from 'antd'
import { Shrink } from 'lucide-react'

const condenseMessagesTool = defineTool({
  key: 'condense_messages',
  label: (t) => t('chat.input.condense.label', 'Condense Context'),
  visibleInScopes: [TopicType.Chat],
  dependencies: {
    actions: ['onTextChange'] as const
  },

  // Register /condense in the QuickPanel "/" menu
  quickPanel: {
    rootMenu: {
      createMenuItems: (context) => {
        const { t } = context
        return [
          {
            label: '/condense',
            description: t('chat.input.condense.description', 'Summarize and condense older messages'),
            icon: <Shrink size={16} />,
            action: () => {
              EventEmitter.emit(EVENT_NAMES.CONDENSE_MESSAGES)
            }
          }
        ]
      }
    },
    triggers: [
      {
        symbol: QuickPanelReservedSymbol.Slash,
        createHandler: () => {
          return () => {
            EventEmitter.emit(EVENT_NAMES.CONDENSE_MESSAGES)
          }
        }
      }
    ]
  },

  render: function CondenseMessagesRender(context) {
    const { t } = context

    return (
      <Tooltip
        placement="top"
        title={t('chat.input.condense.label', 'Condense Context')}
        mouseLeaveDelay={0}
        arrow>
        <ActionIconButton
          onClick={() => {
            EventEmitter.emit(EVENT_NAMES.CONDENSE_MESSAGES)
          }}>
          <Shrink size={18} />
        </ActionIconButton>
      </Tooltip>
    )
  }
})

registerTool(condenseMessagesTool)

export default condenseMessagesTool
