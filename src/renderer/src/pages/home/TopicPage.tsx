import { ErrorBoundary } from '@renderer/components/ErrorBoundary'
import { useActiveTopic } from '@renderer/hooks/useTopic'
import NavigationService from '@renderer/services/NavigationService'
import type { RootState } from '@renderer/store'
import { newMessagesActions } from '@renderer/store/newMessage'
import { setActiveTopicOrSessionAction } from '@renderer/store/runtime'
import type { Assistant, Topic } from '@renderer/types'
import type { FC } from 'react'
import { startTransition, useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import Chat from './Chat'

/**
 * TopicPage renders a chat-only view for a topic opened in its own tab.
 * No assistant sidebar or topic sidebar — just the chat area.
 */
const TopicPage: FC = () => {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Find the assistant that owns this topic
  const assistants = useSelector((state: RootState) => state.assistants.assistants)
  const ownerAssistant = useMemo(() => {
    for (const assistant of assistants) {
      if (assistant.topics?.some((t) => t.id === topicId)) {
        return assistant
      }
    }
    return undefined
  }, [assistants, topicId])

  const { activeTopic, setActiveTopic: _setActiveTopic } = useActiveTopic(
    ownerAssistant?.id ?? '',
    ownerAssistant?.topics?.find((t) => t.id === topicId)
  )

  useEffect(() => {
    NavigationService.setNavigate(navigate)
  }, [navigate])

  // Ensure topic mode is active when this page mounts
  useEffect(() => {
    dispatch(setActiveTopicOrSessionAction('topic'))
  }, [dispatch])

  const setActiveTopic = useCallback(
    (newTopic: Topic) => {
      startTransition(() => {
        _setActiveTopic((prev) => (newTopic?.id === prev.id ? prev : newTopic))
        dispatch(newMessagesActions.setTopicFulfilled({ topicId: newTopic.id, fulfilled: false }))
        dispatch(setActiveTopicOrSessionAction('topic'))
      })
    },
    [_setActiveTopic, dispatch]
  )

  // No-op for setActiveAssistant — assistant is fixed in topic tabs
  const setActiveAssistant = useCallback((_assistant: Assistant) => {
    // Intentionally empty — topic tabs are scoped to a single assistant
  }, [])

  // If the topic or assistant is not found, show a fallback
  if (!ownerAssistant || !activeTopic) {
    return (
      <Container>
        <FallbackMessage>Topic not found. It may have been deleted.</FallbackMessage>
      </Container>
    )
  }

  return (
    <Container>
      <ErrorBoundary>
        <Chat
          assistant={ownerAssistant}
          activeTopic={activeTopic}
          setActiveTopic={setActiveTopic}
          setActiveAssistant={setActiveAssistant}
          hideTopicsSidebar
        />
      </ErrorBoundary>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  [navbar-position='left'] & {
    max-width: calc(100vw - var(--sidebar-width));
  }
  [navbar-position='top'] & {
    max-width: 100vw;
  }
`

const FallbackMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-3);
  font-size: 14px;
`

export default TopicPage
