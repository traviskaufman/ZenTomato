<script>
  export let formattedSeconds;
</script>

<time dateTime={formattedSeconds}>
  {formattedSeconds}
</time>

<style lang="scss">
  time {
    font-size: 12rem;
    @media (max-width: 720px) {
      font-size: 6rem;
    }
    font-weight: 300;
    line-height: 1;
    letter-spacing: -0.015rem;
    margin: 20px auto;
  }
</style>
