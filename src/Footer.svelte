<footer>
  <p>
    A project by <a
      href="https://traviskaufman.io"
      target="_blank"
      rel="noopener noreferrer"
    >
      Travis Kaufman
    </a>
  </p>
</footer>

<style lang="scss">
  footer {
    font-size: 0.75rem;
    opacity: 0.7;
    text-align: center;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 20px;

    @media (max-height: 500px) {
      display: none;
    }

    a {
      color: var(--theme-text-on-primary);
      text-decoration: none;

      &:hover,
      &:active,
      &:focus {
        text-decoration: underline;
      }
    }
  }
</style>
