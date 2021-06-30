/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import logo from './assets/logo.svg';

export default function LogoImage() {
  return <img css={css`margin-bottom: 20px; opacity: 0.7;`} src={logo}
              alt="Zen Tomato – A project by Travis Kaufman"
              width="96"
              height="96" />;
}
