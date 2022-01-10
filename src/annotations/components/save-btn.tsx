import React from 'react'
import styled from 'styled-components'

import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import Margin from 'src/dashboard-refactor/components/Margin'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { DropdownMenuBtn } from 'src/common-ui/components/dropdown-menu-btn'
import SharePrivacyOption from 'src/overview/sharing/components/SharePrivacyOption'
import { getShareButtonData } from '../sharing-utils'
import Mousetrap from 'mousetrap'
import { ButtonTooltip } from 'src/common-ui/components'

export interface Props {
    isShared?: boolean
    isProtected?: boolean
    onSave: (
        shouldShare: boolean,
        isProtected?: boolean,
    ) => void | Promise<void>
}

interface State {
    isPrivacyLevelShown: boolean
}

export default class AnnotationSaveBtn extends React.PureComponent<
    Props,
    State
> {
    state: State = { isPrivacyLevelShown: false }
    static MOD_KEY = getKeyName({ key: 'mod' })

    componentDidMount() {
        Mousetrap.bind('mod+shift+enter', () => this.props.onSave(true, false))
        {
            this.props.isShared
                ? Mousetrap.bind('mod+enter', () =>
                      this.props.onSave(true, false),
                  )
                : Mousetrap.bind('mod+enter', () =>
                      this.props.onSave(false, false),
                  )
        }
        Mousetrap.bind('mod+enter', () => this.props.onSave(false, false))
        Mousetrap.bind('alt+shift+enter', () => this.props.onSave(true, true))
        Mousetrap.bind('alt+enter', () => this.props.onSave(false, true))
    }

    componentWillUnmount() {
        Mousetrap.unbind('mod+shift+enter')
        Mousetrap.unbind('mod+enter')
        Mousetrap.unbind('alt+shift+enter')
        Mousetrap.unbind('alt+enter')
    }

    private get saveIcon(): string {
        return getShareButtonData(this.props.isShared, this.props.isProtected)
            .icon
    }

    private saveWithShareIntent = (shouldShare: boolean) => (
        isProtected?: boolean,
    ) => this.props.onSave(shouldShare, isProtected)

    render() {
        return (
            <>
                <SaveBtn>
                    <ButtonTooltip
                        position="bottom"
                        tooltipText={`${AnnotationSaveBtn.MOD_KEY} + Enter`}
                    >
                        <SaveBtnText
                            onClick={() =>
                                this.props.onSave(
                                    !!this.props.isShared,
                                    !!this.props.isProtected,
                                )
                            }
                        >
                            <Icon filePath={this.saveIcon} height="15px" /> Save
                        </SaveBtnText>
                    </ButtonTooltip>
                    <SaveBtnArrow horizontal="1px">
                        <DropdownMenuBtn
                            btnChildren={<Icon icon="triangle" height="12px" />}
                            isOpen={this.state.isPrivacyLevelShown}
                            toggleOpen={() =>
                                this.setState((state) => ({
                                    isPrivacyLevelShown: !state.isPrivacyLevelShown,
                                }))
                            }
                            menuTitle={'Set & save privacy for this note'}
                            width={'340px'}
                        >
                            <SharePrivacyOption
                                hasProtectedOption
                                icon="webLogo"
                                title="Public"
                                shortcut={`shift+${getKeyName({
                                    key: 'mod',
                                })}+enter`}
                                description="Auto-added to Spaces this page is shared to"
                                onClick={this.saveWithShareIntent(true)}
                                isSelected={this.props.isShared}
                            />
                            <SharePrivacyOption
                                hasProtectedOption
                                icon="person"
                                title="Private"
                                shortcut={''}
                                description="Private to you, until shared (in bulk)"
                                onClick={this.saveWithShareIntent(false)}
                                isSelected={!this.props.isShared}
                            />
                        </DropdownMenuBtn>
                    </SaveBtnArrow>
                </SaveBtn>
            </>
        )
    }
}

const SaveBtn = styled.div`
    flex-direction: row;
    align-item: center;
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    margin-right: 5px;
    background: transparent;
    border-radius: 3px;
    font-weight: 700;
    border 1px solid #f0f0f0;
    display: grid;
    grid-auto-flow: column;

    &:focus {
        background-color: grey;
    }

    &:focus {
        background-color: #79797945;
    }
`

const SaveBtnText = styled.span`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    display: flex;
    padding: 3px 5px 3px 6px;
    display: grid;
    grid-auto-flow: column;
    grid-gap: 5px;
    width: fit-content;
`

const SaveBtnArrow = styled(Margin)`
    width: 24px;
    border-radius: 3px;
    z-index: 10;
    margin: 3px 3px 3px 0px;

    &:hover {
        background-color: #e0e0e0;
    }
`