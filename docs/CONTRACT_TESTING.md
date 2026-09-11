# Contract Testing

Run:

```bash
python -m pytest packages/contracts/tests
```

The included suite checks the public interface and critical safety guards without depending on an external chain.

For full consensus behavior, use Studio manual tests because validator execution, web rendering, and consensus are network-level behavior.
