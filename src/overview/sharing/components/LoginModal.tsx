import React from 'react'
import styled from 'styled-components'

import { ContentScriptsInterface } from 'src/content-scripts/background/types'
import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'
import {
    SignInScreen,
    Props as SignInProps,
} from 'src/authentication/components/SignIn'
import { runInBackground } from 'src/util/webextensionRPC'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import AuthDialog from 'src/authentication/components/AuthDialog'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

export interface Props
    extends Pick<
            ModalProps,
            'onClose' | 'requiresExplicitStyles' | 'ignoreReactPortal'
        >,
        Pick<SignInProps, 'onSuccess' | 'onFail' | 'redirectTo'> {
    contentScriptBG?: ContentScriptsInterface<'caller'>
    contentSharingBG?: ContentSharingInterface
    authBG?: AuthRemoteFunctionsInterface
    routeToLoginBtn?: boolean
}

export default class LoginModal extends React.PureComponent<Props> {
    static defaultProps: Pick<
        Props,
        'contentScriptBG' | 'contentSharingBG' | 'authBG'
    > = {
        contentSharingBG: runInBackground(),
        contentScriptBG: runInBackground(),
        authBG: runInBackground(),
    }

    private handleLoginSuccess = async () => {
        this.props.onSuccess?.()
        this.props.onClose?.({} as any)
        await this.props.authBG.refreshUserInfo()
        this.props.contentSharingBG.executePendingActions()
    }

    private handleGoToClick = () => {
        this.props.contentScriptBG.openAuthSettings()
    }

    render() {
        return (
            <Modal {...this.props}>
                {this.props.routeToLoginBtn ? (
                    <>
                        <TitleText>Login or Sign up</TitleText>
                        <PrimaryAction
                            onClick={this.handleGoToClick}
                            label={'Next'}
                        />
                    </>
                ) : (
                    <>
                        <TitleText>Login or Sign up</TitleText>
                        <AuthDialog onAuth={() => this.handleLoginSuccess()} />
                    </>
                )}
            </Modal>
        )
    }
}

const TitleText = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    background: ${(props) => props.theme.colors.headerGradient};
    font-size: 26px;
    font-weight: bold;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    padding-bottom: 30px;
`
