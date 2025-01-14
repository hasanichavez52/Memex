import React from 'react'

import Tooltip from './tooltip'
import {
    // CopiedComponent,
    // CreatingLinkComponent,
    // DoneComponent,
    // ErrorComponent,
    InitialComponent,
} from './tooltip-states'

import { conditionallyRemoveOnboardingSelectOption } from '../../onboarding-interactions'
import { STAGES } from 'src/overview/onboarding/constants'
import {
    SharedInPageUIInterface,
    SharedInPageUIEvents,
} from 'src/in-page-ui/shared-state/types'
import type {
    TooltipInPageUIInterface,
    AnnotationFunctions,
} from 'src/in-page-ui/tooltip/types'
import { ClickAway } from '@worldbrain/memex-common/lib/common-ui/components/click-away-wrapper'
import {
    shortcuts,
    ShortcutElData,
} from 'src/options/settings/keyboard-shortcuts'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import type {
    Shortcut,
    BaseKeyboardShortcuts,
} from 'src/in-page-ui/keyboard-shortcuts/types'

export interface Props extends AnnotationFunctions {
    inPageUI: TooltipInPageUIInterface
    onInit: any
    createAndCopyDirectLink: any
    openSettings: any
    destroyTooltip: any
}

interface TooltipContainerState {
    showTooltip: boolean
    showingCloseMessage?: boolean
    position: { x: number; y: number } | {}
    tooltipState: 'copied' | 'running' | 'pristine' | 'done'
    keyboardShortCuts: {}
}

async function getShortCut(name: string) {
    let keyboardShortcuts = await getKeyboardShortcutsState()
    const short: Shortcut = keyboardShortcuts[name]

    let shortcut = short.shortcut.split('+')

    return shortcut
}

class TooltipContainer extends React.Component<Props, TooltipContainerState> {
    state: TooltipContainerState = {
        showTooltip: false,
        position: { x: 250, y: 200 },
        tooltipState: 'copied',
        keyboardShortCuts: undefined,
    }

    async componentDidMount() {
        this.props.inPageUI.events?.on('stateChanged', this.handleUIStateChange)
        this.props.onInit(this.showTooltip)

        this.setState({
            keyboardShortCuts: {
                createHighlight: await getShortCut('createHighlight'),
                createAnnotation: await getShortCut('createAnnotation'),
                createAnnotationWithSpace: await getShortCut('addToCollection'),
            },
        })
    }

    componentWillUnmount() {
        this.props.inPageUI.events?.removeListener(
            'stateChanged',
            this.handleUIStateChange,
        )
    }

    handleUIStateChange: SharedInPageUIEvents['stateChanged'] = (event) => {
        if (!('tooltip' in event.changes)) {
            return
        }

        if (!event.newState.tooltip) {
            this.setState({
                showTooltip: false,
                position: {},
            })
        }
    }

    showTooltip = (position) => {
        if (!this.state.showTooltip && this.state.tooltipState !== 'running') {
            this.setState({
                showTooltip: true,
                position,
                tooltipState: 'pristine',
            })
        }
    }

    handleClickOutside = async () => {
        this.props.inPageUI.hideTooltip()
        // Remove onboarding select option notification if it's present
        await conditionallyRemoveOnboardingSelectOption(
            STAGES.annotation.notifiedHighlightText,
        )
    }

    closeTooltip = (event, options = { disable: false }) => {
        event.preventDefault()
        event.stopPropagation()

        this.props.inPageUI.removeTooltip()
    }

    showCloseMessage() {
        this.setState({ showingCloseMessage: true })
    }

    // createLink = async () => {
    //     this.setState({
    //         tooltipState: 'running',
    //     })
    //     await this.props.createAndCopyDirectLink()
    //     this.setState({
    //         tooltipState: 'copied',
    //     })
    // }

    private createAnnotation: React.MouseEventHandler = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            await this.props.createAnnotation(e.shiftKey)
            // Remove onboarding select option notification if it's present
            await conditionallyRemoveOnboardingSelectOption(
                STAGES.annotation.annotationCreated,
            )
        } catch (err) {
            throw err
        } finally {
            window.getSelection().empty()
            // this.setState({ tooltipState: 'pristine' })
            this.props.inPageUI.hideTooltip()
        }
    }

    private createHighlight: React.MouseEventHandler = async (e) => {
        // this.setState({ tooltipState: 'running' })
        try {
            await this.props.createHighlight(e.shiftKey)
        } catch (err) {
            throw err
        } finally {
            window.getSelection().empty()
            // this.setState({ tooltipState: 'pristine' })
            this.props.inPageUI.hideTooltip()
        }
    }

    private addtoSpace: React.MouseEventHandler = async (e) => {
        try {
            await this.props.createAnnotation(false, true)
        } catch (err) {
            throw err
        } finally {
            // this.setState({ tooltipState: 'pristine' })
            window.getSelection().empty()
            this.props.inPageUI.hideTooltip()
        }
    }

    openSettings = (event) => {
        event.preventDefault()
        this.props.openSettings()
    }

    renderTooltipComponent = () => {
        switch (this.state.tooltipState) {
            case 'pristine':
                return (
                    <InitialComponent
                        createHighlight={this.createHighlight}
                        createAnnotation={this.createAnnotation}
                        addtoSpace={this.addtoSpace}
                        closeTooltip={this.closeTooltip}
                        state={this.state.tooltipState}
                        keyboardShortCuts={this.state.keyboardShortCuts}
                    />
                )
            // case 'running':
            //     return <CreatingLinkComponent />
            // case 'copied':
            //     return <CopiedComponent />
            // case 'done':
            //     return <DoneComponent />
            // default:
            //     return <ErrorComponent />
        }
    }

    render() {
        const { showTooltip, position, tooltipState } = this.state

        return (
            <div className="memex-tooltip-container">
                {showTooltip ? (
                    <ClickAway
                        onClickAway={() => this.props.inPageUI.hideTooltip()}
                    >
                        <Tooltip
                            {...position}
                            state={tooltipState}
                            tooltipComponent={this.renderTooltipComponent()}
                            closeTooltip={this.closeTooltip}
                            openSettings={this.openSettings}
                        />
                    </ClickAway>
                ) : null}
            </div>
        )
    }
}

export default TooltipContainer
