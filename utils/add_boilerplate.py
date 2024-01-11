# Copyright (c) 2020-2024 CRS4
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

import logging
import io
import datetime
import os
import re
from typing import Optional, Tuple, Union

# configure logging
logger = logging.getLogger(__name__)


THIS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir)
THIS_YEAR = datetime.date.today().year
C_YEAR = f"2020-{THIS_YEAR}"
LICENSE_FN = os.path.join(THIS_DIR, "LICENSE")
COM_MAP = {
    ".py": "#",
    ".ts": ("/*", "*/"),
    ".js": ("/*", "*/"),
    ".html": ("<!--", "-->"),
    ".css": ("/*", "*/"),
}
EXCLUDE_FILES = set()
EXCLUDE_DIRS = {"build", "dist", "venv", "node_modules"}

PATTERN = re.compile(r"Copyright \(c\) [0-9-]+")
REPL = f"Copyright (c) {C_YEAR}"


def get_boilerplate():
    with io.open(LICENSE_FN, "rt") as f:
        content = f.read()
    return content[content.find("Copyright") :]


def comment(text, com: Union[str, Tuple[str, str]] = "#"):
    # check comment delimiters type
    if not isinstance(com, str) and not isinstance(com, tuple):
        raise TypeError(
            "Comment delimiters should be declared using a string or a 2-tuple."
        )
    # if comment delimiter is a 2-tuple
    if isinstance(com, tuple):
        # check comment delimiters length
        assert len(com) == 2, "Comment delimiters should be declared using a 2-tuple."
        return f"{com[0]}\n{text}{com[1]}\n"
    # if comment delimiter is a string
    out_lines = []
    for line in text.splitlines():
        line = line.strip()
        out_lines.append(com if not line else f"{com} {line}")
    return "\n".join(out_lines) + "\n\n"


def add_boilerplate(boilerplate, fn):
    with io.open(fn, "rt") as f:
        text = f.read()
    if not text:
        return
    m = PATTERN.search(text)
    if m:
        # update existing
        with io.open(fn, "wt") as f:
            f.write(text.replace(m.group(), REPL))
        return
    # add new
    if text.startswith("#!"):
        head, tail = text.split("\n", 1)
        head += "\n\n"
    else:
        head, tail = "", text
    if not tail.startswith("\n"):
        boilerplate += "\n"
    with io.open(fn, "wt") as f:
        f.write(f"{head}{boilerplate}{tail}")


def main():
    # configure logging
    logging.basicConfig(level=logging.INFO)

    join = os.path.join
    boilerplate = get_boilerplate()
    add_boilerplate(boilerplate, LICENSE_FN)
    boilerplate = get_boilerplate()  # read the updated version
    logger.debug("Boilerplate:\n%s", boilerplate)
    print("Boilerplate generated!")
    print("Adding boilerplate to files...")
    bp_map = {ext: comment(boilerplate, com) for ext, com in COM_MAP.items()}
    for root, dirs, files in os.walk(THIS_DIR):
        dirs[:] = [_ for _ in dirs if not _.startswith(".") and _ not in EXCLUDE_DIRS]
        for name in files:
            if name in EXCLUDE_FILES:
                print(f" - skipping {name}...")
                continue
            ext = os.path.splitext(name)[-1]
            try:
                bp = bp_map[ext]
            except KeyError:
                logger.debug(f" - skipping {name}: not supported!")
                continue
            else:
                path = join(root, name)
                logger.debug(f"Adding boilerplate to {path}...")
                add_boilerplate(bp, path)
                print(f" - {name}: OK!")
    print("Done!")


if __name__ == "__main__":
    main()
